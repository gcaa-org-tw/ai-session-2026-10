import type { JSX } from 'react';

export interface ActivityProps {
  isPresenter: boolean;
}

export type ActivityComponent = (props: ActivityProps) => JSX.Element;
