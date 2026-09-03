// Copyright 2017-2026 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* default buttons, dark gray */
export const colorBtnDefault = '#767778';

export const colorBtnShadow = '#98999a';

/* highlighted buttons, orange */
export const colorBtnHighlight = '#f19135';

/* primary buttons, blue */
export const colorBtnPrimary = colorBtnDefault; // '#2e86ab';

/* button text color */
export const colorBtnText = '#f9f8f7';

/* links, quip-brand@b2ae38b tokens/accents.css --coral-text.
   Coral is the brand's one interactive accent, but raw #FF6C78 is 2.7:1 on
   white and fails AA below ~24px; #c93a3f is the documented AA-safe variant for
   coral text and small glyphs on light surfaces, which is exactly what this
   paints. At 5.0:1 it also improves on upstream's #2e86ab, which was 4.1:1. */
export const colorLink = '#c93a3f';

export default `
  .theme--dark,
  .theme--light {
    a:not(.ui--Tab) {
      color: ${colorLink};

      &:hover,
      a:visited {
        color: ${colorLink};
      }
    }

    .ui--Button {
      &.isIcon:not(.isDisabled):not(.withoutLink):not(:hover) {
        .ui--Icon {
          color: ${colorLink};
        }
      }
    }

    .ui.modal > .header:not(.ui) {
      border-bottom-color: ${colorBtnDefault};
    }

    .ui.negative.button,
    .ui.buttons .negative.button {
      background: #666 !important;
    }
  }
`;
