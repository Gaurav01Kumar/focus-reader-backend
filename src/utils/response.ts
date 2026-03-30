import { Response } from 'express';

interface ResponseData<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error: any | null;
  statusCode: number;
}

export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
) => {
  const response: ResponseData<T> = {
    success: true,
    message,
    data: data ?? null,
    error: null,
    statusCode,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  error: any = {},
  statusCode: number = 500
) => {
  const response: ResponseData = {
    success: false,
    message,
    data: null,
    error: error ?? null,
    statusCode,
  };
  return res.status(statusCode).json(response);
};
