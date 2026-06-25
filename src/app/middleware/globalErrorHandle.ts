import { NextFunction, Request, Response } from "express"
import { env } from "../config/env";
import { AppError } from "../utils/apiError";



interface iError {
    path: string,
    message: string
}


export const globalError = async(err:any, req: Request, res: Response, next: NextFunction)=>{

    let statuscode = 500;
    let message = ` something went wrong `;
    const errorSources: iError[] = [
    //     {
    //     path: "",
    //     message: ""
    // }
];


// if(req.file){
//     await cloudinaryDeleteUpload(req.file.path);
//  }

//  if(req.files && Array.isArray(req.files) && req.files.length > 0){

//     const allImages = (req.files as Express.Multer.File[])?.map(file => file.path)

//     await Promise.all(allImages.map(url => cloudinaryDeleteUpload(url)));
//  }
    
    if(err.code === 11000){

        const matchArray = err.message.match(/"([^"]*)"/) // regx
         statuscode = 400;
        message = `${matchArray[1]} already exist`

    }else if(err.name === "CastError"){
        statuscode = 400;
        message = "Invalid Mongodb ObjectId"

        errorSources.push({
            path: err.path,
            message: `Invalid value for ${err.path}`,
        });

    }else if(err.name === "ValidationError"){
        statuscode= 400;

        const errors = Object.values(err.errors) 
                                           

        errors.forEach((errorObject: any) => errorSources.push({
            path: errorObject.path,
            message: errorObject.message
        }))

        message = " mongoose Validation error"


    }else if(err.name === "ZodError"){

        statuscode= 400
        message = "Zod validation error"

        err.issues.forEach((issue:any)=> errorSources.push({
            path: issue.path[ issue.path -1],  
            message: issue.message
        }))

    }
    else if( err instanceof AppError){
        statuscode = err.statusCode,
        message = err.message



    }else if(err instanceof Error){ 
        statuscode = 500,
        message = err.message


    }
    res.status(statuscode).json({
        success: false,
        message,
        errorSources, 
        err: env.nodeEnv === "development"? err : null,
        stack: env.nodeEnv=== "development" ? err.stack : null
    })
}