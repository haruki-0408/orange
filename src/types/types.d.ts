import { FunctionComponent, ReactNode } from 'react';

export type FCX<Props = unknown> = FunctionComponent<Props & { className?: string; children?: ReactNode }>;
