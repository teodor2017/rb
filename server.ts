// import './tracer'; // must come before importing any instrumented module.
import { createNodeMiddleware } from "@octokit/app";  
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { app } from './github/webhooks'
import { createLogger} from "./logging";

const logger = createLogger(__filename)

export const startServer = async () => {
    const middleware = createNodeMiddleware(app);
    const port = process.env.PORT ? process.env.PORT : 3000
    logger.info({port}, `Listening on port ${port}`)
    const srv = createServer(middleware).listen(port);
    srv.on("request", (req: IncomingMessage, res: ServerResponse)=>{
        logger.info('incoming webhook', {
            "method": req.method,
            "url": req.url,
            "statusCode": res.statusCode,
        });
    })
    return
}
