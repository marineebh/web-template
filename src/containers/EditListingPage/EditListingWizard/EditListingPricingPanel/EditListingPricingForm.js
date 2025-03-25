import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import appSettings from '../../../../config/settings';
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { formatMoney } from '../../../../util/currency';
import { types as sdkTypes } from '../../../../util/sdkLoader';

// Import shared components
import { Button, Form, FieldCurrencyInput } from '../../../../components';

// Import modules from this directory
import css from './EditListingPricingForm.module.css';

const { Money } = sdkTypes;

const FIXED_PRICE = new Money(900, 'EUR'); // 9.00 EUR

export const EditListingPricingForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId = 'EditListingPricingForm',
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress = false,
        fetchErrors,
      } = formRenderProps;

      const intl = useIntl();
      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;
      const { updateListingError, showListingsError } = fetchErrors || {};

      return (
        <Form onSubmit={handleSubmit} className={classes}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.updateFailed" />
            </p>
          ) : null}
          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPricingForm.showListingFailed" />
            </p>
          ) : null}
          
          {/* Prix fixé à 9€ et champ désactivé */}
          <FieldCurrencyInput
            id={`${formId}price`}
            name="price"
            className={css.input}
            label={intl.formatMessage(
              { id: 'EditListingPricingForm.pricePerProduct' }
            )}
            currencyConfig={appSettings.getCurrencyFormatting('EUR')}
            value={FIXED_PRICE} // Valeur fixée à 9€
            disabled={true} // Empêche la modification
          />

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingPricingForm;
