import { Router } from "express";
import { healthRoute } from "../utils/health.route";
import { authRoute } from "../modules/auth/auth.route";
import { userRoute } from "../modules/user/user.router";
import { propertyRouter } from "../modules/property/property.route";
import { reviewRouter } from "../modules/review/review.route";
import { inquiryRouter } from "../modules/inquiry/inquiry.router";
import { aiRouter } from "../modules/AI/ai.router";

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
      {
        path: "/property",
        route: propertyRouter
    },
      {
        path: "/review",
        route: reviewRouter
    },
       {
        path: "/inquiry",
        route: inquiryRouter
    },
    {
        path: "/AI",
        route: aiRouter
    }
]


moduleRouters.forEach ((routes)=>{
    router.use(routes.path, routes.route)
})