import { Router } from "express";
import { healthRoute } from "../utils/health.route";

export const router = Router();

const moduleRouters = [
    {
        path: "/health",
        route: healthRoute
    }
]


moduleRouters.forEach ((routes)=>{
    router.use(routes.path, routes.route)
})