import {Fragment} from 'react';

const ICON_COLOR = '#050F2E';
const ICON_BACKGROUND_COLOR = '#F3F3F3';

export function ScaleIcon() {
  return (
    <Fragment>
      <circle cx="8" cy="8" r="8" fill={ICON_BACKGROUND_COLOR} />
      <g transform="translate(4, 2)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.99996 0.820219C2.99996 0.367258 3.36716 6.10352e-05 3.82012 6.10352e-05C4.27308 6.10352e-05 4.64027 0.367258 4.64027 0.820219V3.55216L6.04518 2.98454C6.46516 2.81486 6.94318 3.01777 7.11286 3.43774C7.28254 3.85772 7.07964 4.33574 6.65966 4.50542L1.3366 6.65608C0.916618 6.82576 0.438604 6.62285 0.268922 6.20287C0.0992403 5.7829 0.302145 5.30488 0.722123 5.1352L3.00068 4.2146C3.0002 4.2031 2.99996 4.19153 2.99996 4.1799V0.820219ZM6.04523 6.3073C6.4652 6.13762 6.94322 6.34052 7.1129 6.7605C7.28258 7.18048 7.07968 7.65849 6.6597 7.82817L4.64032 8.64406V11.7526C4.64032 12.2056 4.27312 12.5728 3.82016 12.5728C3.3672 12.5728 3 12.2056 3 11.7526V9.30679L1.33664 9.97883C0.91666 10.1485 0.438646 9.94561 0.268964 9.52563C0.0992823 9.10565 0.302187 8.62764 0.722165 8.45795L6.04523 6.3073Z"
          fill={ICON_COLOR}
        />
      </g>
    </Fragment>
  );
}
