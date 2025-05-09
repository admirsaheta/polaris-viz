import type {ReactNode} from 'react';
import {useEffect, useRef, useState, useMemo, useCallback} from 'react';
import {InternalChartType, useChartContext} from '@shopify/polaris-viz-core';
import type {
  DataType,
  BoundingRect,
  DataSeries,
  ChartType,
} from '@shopify/polaris-viz-core';
import {createPortal} from 'react-dom';
import type {ScaleBand, ScaleLinear} from 'd3-scale';

import {useRootContainer} from '../../hooks/useRootContainer';
import type {Margin} from '../../types';
import {SwallowErrors} from '../SwallowErrors';
import {TOOLTIP_ID} from '../../constants';

import {getHorizontalBarChartTooltipPosition} from './utilities/getHorizontalBarChartTooltipPosition';
import {getLineChartTooltipPosition} from './utilities/getLineChartTooltipPosition';
import {getVerticalBarChartTooltipPosition} from './utilities/getVerticalBarChartTooltipPosition';
import {shouldBlockTooltipEvents} from './utilities/shouldBlockTooltipEvents';
import type {TooltipPosition} from './types';
import {DEFAULT_TOOLTIP_POSITION} from './constants';
import {TooltipAnimatedContainer} from './components/TooltipAnimatedContainer';
import {getDonutChartTooltipPosition} from './utilities/getDonutChartTooltipPosition';

const TOUCH_START_DELAY = 300;

interface BaseProps {
  chartBounds: BoundingRect;
  chartType: InternalChartType;
  focusElementDataType: DataType;
  getMarkup: (index: number) => ReactNode;
  margin: Margin;
  parentElement: SVGSVGElement | null;
  bandwidth?: number;
  data?: DataSeries[];
  forceActiveIndex?: number | null;
  onIndexChange?: (index: number | null) => void;
  id?: string;
  longestSeriesIndex?: number;
  type?: ChartType;
  xScale?: ScaleLinear<number, number> | ScaleBand<string>;
  yScale?: ScaleLinear<number, number>;
}

function TooltipWrapperRaw(props: BaseProps) {
  const {
    bandwidth = 0,
    chartBounds,
    chartType,
    data,
    forceActiveIndex,
    focusElementDataType,
    id,
    longestSeriesIndex,
    onIndexChange,
    parentElement,
    type,
    xScale,
    yScale,
  } = props;
  const {scrollContainer, isTouchDevice, containerBounds} = useChartContext();
  const [position, setPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
    activeIndex: -1,
    position: DEFAULT_TOOLTIP_POSITION,
  });

  const activeIndexRef = useRef<number | null>(null);
  const touchStartTimer = useRef<number>(0);
  const isLongTouch = useRef(false);

  const focusElements = useMemo<NodeListOf<SVGPathElement> | undefined>(() => {
    return parentElement?.querySelectorAll(
      `[data-type="${focusElementDataType}"][aria-hidden="false"]`,
    );
  }, [focusElementDataType, parentElement]);

  useEffect(() => {
    activeIndexRef.current = position.activeIndex;
  }, [position.activeIndex]);

  const alwaysUpdatePosition =
    [InternalChartType.Line, InternalChartType.Donut].includes(chartType) &&
    !isTouchDevice;

  const getPosition = useCallback(
    ({
      event,
      eventType,
      index,
    }: {
      eventType: 'mouse' | 'focus';
      event?: MouseEvent | TouchEvent | FocusEvent;
      index?: number;
    }) => {
      const scrollY = scrollContainer == null ? 0 : scrollContainer.scrollTop;

      switch (chartType) {
        case InternalChartType.Line:
          return getLineChartTooltipPosition({
            chartBounds,
            containerBounds,
            scrollY,
            data: data ?? [],
            event,
            eventType,
            index,
            isTouchDevice,
            longestSeriesIndex: longestSeriesIndex ?? 0,
            xScale: xScale as ScaleLinear<number, number>,
          });
        case InternalChartType.HorizontalBar:
          return getHorizontalBarChartTooltipPosition({
            chartBounds,
            data: data ?? [],
            event,
            eventType,
            index,
            longestSeriesIndex: longestSeriesIndex ?? 0,
            type,
            xScale: xScale as ScaleLinear<number, number>,
          });
        case InternalChartType.Donut:
          return getDonutChartTooltipPosition({
            containerBounds,
            event,
            eventType,
            index: index ?? forceActiveIndex ?? undefined,
            parentElement,
          });
        case InternalChartType.Bar:
        default:
          return getVerticalBarChartTooltipPosition({
            chartBounds,
            containerBounds,
            data: data ?? [],
            event,
            eventType,
            index,
            longestSeriesIndex: longestSeriesIndex ?? 0,
            type,
            xScale: xScale as ScaleBand<string>,
            yScale: yScale as ScaleLinear<number, number>,
          });
      }
    },
    [
      chartBounds,
      containerBounds,
      chartType,
      data,
      forceActiveIndex,
      longestSeriesIndex,
      isTouchDevice,
      type,
      xScale,
      yScale,
      scrollContainer,
      parentElement,
    ],
  );

  const showAndPositionTooltip = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const newPosition = getPosition({event, eventType: 'mouse'});

      const scrollContainerTop = Number(scrollContainer?.scrollTop ?? 0);
      const y = newPosition.y + scrollContainerTop;

      if (
        alwaysUpdatePosition &&
        (newPosition.x < chartBounds.x || y < chartBounds.y)
      ) {
        return;
      }

      if (
        !alwaysUpdatePosition &&
        activeIndexRef.current === newPosition.activeIndex
      ) {
        return;
      }

      if (shouldBlockTooltipEvents(event)) {
        return;
      }

      setPosition(newPosition);
      onIndexChange?.(newPosition.activeIndex);
    },
    [
      alwaysUpdatePosition,
      chartBounds,
      getPosition,
      onIndexChange,
      scrollContainer,
    ],
  );

  const onMouseMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      window.clearTimeout(touchStartTimer.current);

      if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
        if (isLongTouch.current === true) {
          // prevents scrolling after long touch (since it is supposed to move the tooltip/datapoint vs scroll)
          event?.preventDefault();
        } else {
          return;
        }
      }

      showAndPositionTooltip(event);
    },
    [showAndPositionTooltip],
  );

  const onMouseLeave = useCallback(() => {
    isLongTouch.current = false;
    window.clearTimeout(touchStartTimer.current);
    onIndexChange?.(null);
    setPosition((prevState) => {
      return {...prevState, activeIndex: -1};
    });
  }, [onIndexChange]);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      touchStartTimer.current = window.setTimeout(() => {
        event.preventDefault();

        isLongTouch.current = true;

        showAndPositionTooltip(event);
      }, TOUCH_START_DELAY);
    },
    [showAndPositionTooltip],
  );

  const onFocus = useCallback(
    (event: FocusEvent) => {
      const target = event.currentTarget as SVGSVGElement;

      if (!target) {
        return;
      }

      const index = Number(target.dataset.index);
      const newPosition = getPosition({event, index, eventType: 'focus'});

      setPosition(newPosition);
      onIndexChange?.(newPosition.activeIndex);
    },
    [getPosition, onIndexChange],
  );

  const onFocusIn = useCallback(() => {
    if (!parentElement?.contains(document.activeElement)) {
      onMouseLeave();
    }
  }, [parentElement, onMouseLeave]);

  const setFocusListeners = useCallback(
    (attach: boolean) => {
      if (!focusElements) {
        return;
      }

      focusElements.forEach((el: SVGPathElement) => {
        if (attach) {
          el.addEventListener('focus', onFocus);
        } else {
          el.removeEventListener('focus', onFocus);
        }
      });
    },
    [focusElements, onFocus],
  );

  useEffect(() => {
    if (!parentElement) {
      return;
    }

    parentElement.addEventListener('mousemove', onMouseMove);
    parentElement.addEventListener('mouseleave', onMouseLeave);
    parentElement.addEventListener('touchstart', onTouchStart);
    parentElement.addEventListener('touchmove', onMouseMove);
    parentElement.addEventListener('touchend', onMouseLeave);

    setFocusListeners(true);

    return () => {
      parentElement.removeEventListener('mousemove', onMouseMove);
      parentElement.removeEventListener('mouseleave', onMouseLeave);
      parentElement.removeEventListener('touchstart', onTouchStart);
      parentElement.removeEventListener('touchmove', onMouseMove);
      parentElement.removeEventListener('touchend', onMouseLeave);

      setFocusListeners(false);
    };
  }, [
    parentElement,
    onMouseLeave,
    onTouchStart,
    setFocusListeners,
    onMouseMove,
  ]);

  useEffect(() => {
    document.addEventListener('focusin', onFocusIn);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [parentElement, onFocusIn]);

  if (position.activeIndex == null || position.activeIndex < 0) {
    return null;
  }

  return (
    <TooltipAnimatedContainer
      bandwidth={bandwidth}
      chartBounds={chartBounds}
      chartType={chartType}
      currentX={position.x}
      currentY={position.y}
      id={id}
      margin={props.margin}
      position={position.position}
    >
      {props.getMarkup(position.activeIndex)}
    </TooltipAnimatedContainer>
  );
}

interface TooltipWrapperProps extends BaseProps {
  usePortal?: boolean;
}

export function TooltipWrapper({
  usePortal = false,
  ...props
}: TooltipWrapperProps) {
  if (usePortal) {
    return <TooltipWithPortal {...props} />;
  }

  return <TooltipWithErrors {...props} />;
}

function TooltipWithErrors(props: BaseProps) {
  return (
    <SwallowErrors>
      <TooltipWrapperRaw {...props} />
    </SwallowErrors>
  );
}

function TooltipWithPortal(props: BaseProps) {
  const container = useRootContainer(TOOLTIP_ID);

  return createPortal(<TooltipWithErrors {...props} />, container);
}
