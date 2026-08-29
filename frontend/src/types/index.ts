export type AppEnvironment = 'dev' | 'preprod' | 'production';

export interface ApiErrorShape {
  status: number;
  message: string;
  code?: string;
}
