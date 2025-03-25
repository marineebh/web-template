
import React, { Component } from 'react';
import { func, object, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { ensureListing } from '../../../util/data';

import css from './SearchMapPriceLabel.module.css';

// SVG Maison
const HouseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3L2 9H4V19H10V13H14V19H20V9H22L12 3Z"
      fill="currentColor"
    />
  </svg>
);

class SearchMapPriceLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const currentListing = ensureListing(this.props.listing);
    const nextListing = ensureListing(nextProps.listing);
    const isSameListing = currentListing.id.uuid === nextListing.id.uuid;
    const hasSameActiveStatus = this.props.isActive === nextProps.isActive;
    const hasSameRefreshToken =
      this.props.mapComponentRefreshToken === nextProps.mapComponentRefreshToken;

    return !(isSameListing && hasSameActiveStatus && hasSameRefreshToken);
  }

  render() {
    const {
      className,
      rootClassName,
      listing,
      onListingClicked,
      isActive,
    } = this.props;
    const currentListing = ensureListing(listing);

    const classes = classNames(rootClassName || css.root, className);
    const houseLabelClasses = classNames(css.houseLabel, {
      [css.mapLabelActive]: isActive,
    });
    const caretClasses = classNames(css.caret, { [css.caretActive]: isActive });

    return (
      <button className={classes} onClick={() => onListingClicked(currentListing)}>
        <div className={css.caretShadow} />
        <div className={houseLabelClasses}>
          <HouseIcon />
        </div>
        <div className={caretClasses} />
      </button>
    );
  }
}

SearchMapPriceLabel.defaultProps = {
  className: null,
  rootClassName: null,
};

SearchMapPriceLabel.propTypes = {
  className: string,
  rootClassName: string,
  listing: propTypes.listing.isRequired,
  onListingClicked: func.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(SearchMapPriceLabel);
