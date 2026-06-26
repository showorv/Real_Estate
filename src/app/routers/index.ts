import { Router } from "express";
import { healthRoute } from "../utils/health.route";
import { authRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.router";

export const router = Router();

const moduleRouters = [
    {
        path: "/health",
        route: healthRoute
    },
     {
        path: "/auth",
        route: authRoute
    },
     {
        path: "/user",
        route: userRoute
    },
]


moduleRouters.forEach ((routes)=>{
    router.use(routes.path, routes.route)
})