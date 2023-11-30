import fs from "fs";

/**
 * Saves data to a temporary file.
 * @param data 
 * @returns Name of temporary file.
 */
export const createTempFile = async (fname:string, data: any): Promise<void>=> {
    return fs.writeFileSync(
        fname,
        data,
        {
            encoding: "utf8",
            flag: "w",
            mode: 0o666,
        });
}

/**
 * Deletes a file.
 * @param filepath 
 * @returns 
 */
export const deleteFile = async (filename:any): Promise<void> => {
    return fs.unlink(filename, (err) => { if (err) { throw err }});
}

/*
    * formatString formats string by replacing placeholders with values.
    * The placeholders are surrounded by curly braces, e.g. {major}.
    * @throws if the key is not found in the args
*/
export const formatString = (format: string, args: any): string => {
    for (const k in args) {
        // if (format.indexOf(k) === -1) {
        //     throw new Error(`Key ${k} not found in format string ${format}`);
        // }
        format = format.replace(`{${k}}`, args[k]);
    }
    return format
}


