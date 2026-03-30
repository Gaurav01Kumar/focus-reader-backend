import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export const protectRoute = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};