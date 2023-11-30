import { execSync } from "child_process";
import yaml from "yaml";
import { createTempFile, deleteFile, } from "./utils";
import {v4 as uuid} from "uuid";
import {  readFileSync } from "fs";
import { Configuration } from "./types";
import { createLogger } from "../logging";

const log = createLogger(__filename)


const helpMessage = yaml.parse(readFileSync("src/yaml-schemas/config-helpers.yaml").toString());
const schemaPath = "src/yaml-schemas/config-schema.yaml";

export const validateConfiguration = async (configuration: Configuration) => {
    const filename = `/tmp/${uuid()}.yaml` 
    log.debug(`configuration.validator.validateConfiguration: Creating temporary file ${filename}`)
    await createTempFile(filename, yaml.stringify(configuration)).catch( err => {
        log.warn(`configuration.validator.validateConfiguration: ${err} Failed to create temporary file ${filename}`)
    });


    log.debug(`configuration.validator.validateConfiguration: Validating configuration`)
    try 
    {
        execSync(`yamale -s ${schemaPath} ${filename}`)
        return {valid: true, errors: ""}
    }
    catch (err) 
    {
        log.warn(`configuration.validator.validateConfiguration: Configuration invalid due to ${err} with stdout: ${err.stdout.toString()} and stderr: ${err.stderr.toString()}`)
        return {valid: false, errors: buildOutputMessage(err.stdout.toString())};
    } finally {
        log.debug(`configuration.validator.validateConfiguration: Deleting temporary file ${filename}`)
        deleteFile(filename)
    }

}

/**
 * Builds a structured error message based on error output from Yamale.
 * @param errors 
 * @returns 
 */
const buildOutputMessage = (errors: any) => {

    const dict = extractValidationErrors(errors);
    let output = "| ℹ️ **Option** ℹ️ | ❗ **Error** ❗ | ⚠️**Help Message**⚠️ |\n| :---: | :---: | :---: |\n";

    for(const key in dict) {
        output += "| ``` " + key + " ``` | " + dict[key].replace(/'/g, "```") + '\n';
    }

    return output;
}

/**
 * Extracts errors as [key] : [reason -> help] pairs in a dictionary.
 * @param input 
 * @returns 
 */
const extractValidationErrors = (input: string) => {
    
    const lines = input.split('\n').filter(l => l.includes(':'));
    let dict = {}

    lines.forEach(line => {
        const split = line.split(':')
        dict[split[0].replace(/\s/g,'')] = split[1]
    })

    dict = provideHelp(dict);

    return dict;
}

/**
 * Adds help message to each error based on the key that caused it.
 * @param errors 
 * @returns 
 */
const provideHelp = (errors: any) => {
    for (const key in errors) {
        errors[key] += " | *" + helpMessage[key.replace(/[0-9]./g, '')] + "* |";
    }
    return errors;
}