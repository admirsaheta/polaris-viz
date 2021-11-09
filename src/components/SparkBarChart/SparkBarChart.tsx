import React from 'react';

import type {DataSeries} from '../../types';
import {ChartContainer} from '../ChartContainer';

import {Chart} from './Chart';

export interface SparkBarChartProps {
  data: DataSeries[];
  dataOffsetRight?: number;
  dataOffsetLeft?: number;
  accessibilityLabel?: string;
  isAnimated?: boolean;
  theme?: string;
}

export function SparkBarChart({
  data,
  accessibilityLabel,
  isAnimated = false,
  dataOffsetRight = 0,
  dataOffsetLeft = 0,
  theme,
}: SparkBarChartProps) {
  return (
    <ChartContainer theme={theme}>
      <Chart
        data={data}
        dataOffsetRight={dataOffsetRight}
        dataOffsetLeft={dataOffsetLeft}
        accessibilityLabel={accessibilityLabel}
        isAnimated={isAnimated}
        theme={theme}
      />
    </ChartContainer>
  );
}
