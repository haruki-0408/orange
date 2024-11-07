// src/types/types.d.ts
import { FunctionComponent, ReactNode } from 'react';

export type FCX<P = {}> = FunctionComponent<P & { className?: string; children?: ReactNode }>;
