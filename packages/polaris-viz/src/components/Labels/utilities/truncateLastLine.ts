import type {CharacterWidths} from '@shopify/polaris-viz-core';

import {estimateTextHeight} from './estimateTextHeight';
import {formatAndAddEllipsis} from './formatAndAddEllipsis';

const MAX_CYCLES = 10;

interface Props {
  characterWidths: CharacterWidths;
  label: string;
  targetHeight: number;
  targetWidth: number;
}

const STEP = 1;

export function truncateLastLine({
  label,
  targetHeight,
  targetWidth,
  characterWidths,
}: Props) {
  let newLabel = label;
  let lineStart = 0;
  let lineEnd = label.length;
  let counter = 0;

  if (lineEnd < lineStart) {
    return newLabel;
  }

  while (lineStart <= lineEnd && counter < MAX_CYCLES) {
    const middle = Math.floor((lineStart + lineEnd) / 2);
    newLabel = label.substring(0, middle);

    if (newLabel.length < label.length) {
      newLabel = formatAndAddEllipsis(newLabel);
    }

    const newLabelHeight = estimateTextHeight({
      label: newLabel,
      targetWidth,
      characterWidths,
    });

    if (newLabelHeight === targetHeight) {
      break;
    }

    if (newLabelHeight > targetHeight) {
      lineEnd = middle - STEP;
    }

    if (newLabelHeight < targetHeight) {
      lineStart = middle + STEP;
    }

    counter += STEP;
  }

  if (newLabel.length === label.length - 1) {
    return label;
  } else {
    return newLabel;
  }
}
