
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const userMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      message: "Missing or invalid token",
      redirect: "Sign In"
    })
    return;
  }

  // @ts-ignore
  const token = authHeader.split(' ')[1];

  try {
    
    // @ts-ignore
    const jwt_valid = await jwt.verify(token, process.env.JWT_SECERET);
    console.log(jwt_valid);

    (req as any).user = jwt_valid;
    next();
  }
  catch(error) {
    res.status(401).json({
      message: "Invalid JWT"
    })
  }
}

export default userMiddleware;