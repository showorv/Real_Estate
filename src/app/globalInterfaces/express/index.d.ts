import { JwtPayload } from "jsonwebtoken";
import { AuthUser } from "../../constraints/user";

// for declare types of express for third party packages

declare global{
    namespace Express {
        interface Request {
            user: AuthUser | undefined;
        }
    }
}