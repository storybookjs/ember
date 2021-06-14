import { StorybookLogo } from '@storybook/components';
import { styled } from '@storybook/theming';
import {
  ErrorMessage,
  Field as FormikInput,
  Form as FormikForm,
  Formik,
  FormikProps,
} from 'formik';
import React, { FC, HTMLAttributes, useCallback, useState } from 'react';

// https://emailregex.com/
const email99RegExp = new RegExp(
  // eslint-disable-next-line no-useless-escape
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);

const w3cEmailRegExp = new RegExp(
  /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
);

export interface AccountFormResponse {
  success: boolean;
}

export interface AccountFormValues {
  email: string;
  password: string;
}

interface FormValues extends AccountFormValues {
  verifiedPassword: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

type AccountFormProps = {
  passwordVerification?: boolean;
  onSubmit?: (values: AccountFormValues) => void;
  onTransactionStart?: (values: AccountFormValues) => void;
  onTransactionEnd?: (values: AccountFormResponse) => void;
};

export const AccountForm: FC<AccountFormProps> = ({
  passwordVerification,
  onSubmit,
  onTransactionStart,
  onTransactionEnd,
}) => {
  const [state, setState] = useState({
    transacting: false,
    transactionSuccess: false,
    transactionFailure: false,
  });

  const handleFormSubmit = useCallback(
    async ({ email, password }: FormValues, { setSubmitting, resetForm }) => {
      if (onSubmit) {
        onSubmit({ email, password });
      }

      if (onTransactionStart) {
        onTransactionStart({ email, password });
      }

      setSubmitting(true);

      setState({
        ...state,
        transacting: true,
      });

      await new Promise((r) => setTimeout(r, 2100));

      const success = Math.random() < 1;

      if (onTransactionEnd) {
        onTransactionEnd({ success });
      }

      setSubmitting(false);
      resetForm({ values: { email: '', password: '', verifiedPassword: '' } });

      setState({
        ...state,
        transacting: false,
        transactionSuccess: success === true,
        transactionFailure: success === false,
      });
    },
    [setState, onTransactionEnd, onTransactionStart]
  );

  return (
    <Wrapper>
      <StorybookLogo alt="Join Storybook" />
      {!state.transactionSuccess && !state.transactionFailure && (
        <Introduction>Create an account and become a part of the Storybook community</Introduction>
      )}
      <Content>
        {state.transactionSuccess && !state.transactionFailure && (
          <Presentation>
            <p>
              Everything is almost perfect, your account has been made and we should probably get
              you started
            </p>
            <p>So why don't you go ahead and get started then?</p>
            <Submit
              onClick={() => {
                setState({
                  transacting: false,
                  transactionSuccess: false,
                  transactionFailure: false,
                });
              }}
            >
              Go back
            </Submit>
          </Presentation>
        )}
        {state.transactionFailure && !state.transactionSuccess && (
          <Presentation>
            <p>What a mess, this API is not working</p>
            <p>
              Someone should probably have a stern talking to about this, but it won't be me - coz
              I'm gonna head out into the nice weather
            </p>
            <Submit
              onClick={() => {
                setState({
                  transacting: false,
                  transactionSuccess: false,
                  transactionFailure: false,
                });
              }}
            >
              Go back
            </Submit>
          </Presentation>
        )}
        {!state.transactionSuccess && !state.transactionFailure && (
          <Formik
            initialValues={{ email: '', password: '', verifiedPassword: '' }}
            validateOnBlur={false}
            validateOnChange={false}
            onSubmit={handleFormSubmit}
            validate={({ email, password, verifiedPassword }) => {
              const errors: FormErrors = {};

              if (!email) {
                errors.email = 'Please enter your email address';
              } else {
                const validEmail = email.match(email99RegExp);

                if (validEmail === null) {
                  errors.email = 'Please enter a correctly formatted email address';
                }
              }

              if (!password) {
                errors.password = 'Please enter a password';
              } else if (password.length < 6) {
                errors.password = 'Please enter a password of minimum 6 characters';
              }

              if (passwordVerification && !verifiedPassword) {
                errors.verifiedPassword = 'Please verify your password';
              } else if (passwordVerification && password !== verifiedPassword) {
                errors.verifiedPassword = 'Your passwords do not match';
              }

              return errors;
            }}
          >
            {({ errors, isSubmitting }: FormikProps<FormValues>) => (
              <Form aria-disabled={isSubmitting ? 'true' : 'false'}>
                <FieldWrapper>
                  <Label htmlFor="email">Email</Label>
                  <FormikInput id="email" name="email">
                    {({ field }: { field: HTMLAttributes<HTMLInputElement> }) => (
                      <Input
                        data-testid="email"
                        aria-required="true"
                        aria-disabled={isSubmitting ? 'true' : 'false'}
                        disabled={isSubmitting}
                        type="email"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        {...field}
                      />
                    )}
                  </FormikInput>
                  <Error name="email" component="div" />
                </FieldWrapper>
                <FieldWrapper>
                  <Label htmlFor="password">Password</Label>
                  <FormikInput id="password" name="password">
                    {({ field }: { field: HTMLAttributes<HTMLInputElement> }) => (
                      <Input
                        data-testid="password1"
                        aria-required="true"
                        aria-disabled={isSubmitting ? 'true' : 'false'}
                        aria-invalid={errors.password ? 'true' : 'false'}
                        type="password"
                        disabled={isSubmitting}
                        {...field}
                      />
                    )}
                  </FormikInput>
                  <Error name="password" component="div" />
                </FieldWrapper>
                {passwordVerification && (
                  <FieldWrapper>
                    <Label htmlFor="verifiedPassword">Verify Password</Label>
                    <FormikInput id="verifiedPassword" name="verifiedPassword">
                      {({ field }: { field: HTMLAttributes<HTMLInputElement> }) => (
                        <Input
                          data-testid="password2"
                          aria-required="true"
                          aria-disabled={isSubmitting ? 'true' : 'false'}
                          aria-invalid={errors.verifiedPassword ? 'true' : 'false'}
                          type="password"
                          disabled={isSubmitting}
                          {...field}
                        />
                      )}
                    </FormikInput>
                    <Error name="verifiedPassword" component="div" />
                  </FieldWrapper>
                )}
                <Actions>
                  <Submit
                    data-testid="submit"
                    aria-disabled={isSubmitting ? 'true' : 'false'}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    Create Account
                  </Submit>
                  <Reset
                    aria-disabled={isSubmitting ? 'true' : 'false'}
                    disabled={isSubmitting}
                    type="reset"
                  >
                    Reset
                  </Reset>
                </Actions>
              </Form>
            )}
          </Formik>
        )}
      </Content>
    </Wrapper>
  );
};

const Wrapper = styled.section(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 450,
  padding: 32,
  backgroundColor: theme.background.content,
  borderRadius: 7,
}));

const Introduction = styled.p({
  marginTop: 20,
  textAlign: 'center',
});

const Content = styled.div({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  width: 350,
  minHeight: 189,
  marginTop: 8,
});

const Presentation = styled.div({
  textAlign: 'center',
});

const Form = styled(FormikForm)({
  width: '100%',
  alignSelf: 'flex-start',
  '&[aria-disabled="true"]': {
    opacity: 0.6,
  },
});

const FieldWrapper = styled.div({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  marginBottom: 10,
});

const Label = styled.label({
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
});

const Input = styled.input(({ theme }) => ({
  fontSize: 14,
  color: theme.color.defaultText,
  padding: '10px 15px',
  borderRadius: 4,
  appearance: 'none',
  outline: 'none',
  border: '0 none',
  boxShadow: 'rgb(0 0 0 / 10%) 0px 0px 0px 1px inset',
  '&:focus': {
    boxShadow: 'rgb(30 167 253) 0px 0px 0px 1px inset',
  },
  '&:active': {
    boxShadow: 'rgb(30 167 253) 0px 0px 0px 1px inset',
  },
  '&[aria-invalid="true"]': {
    boxShadow: 'rgb(255 68 0) 0px 0px 0px 1px inset',
  },
}));

const Helper = styled.div({
  marginTop: 4,
  fontSize: 10,
});

const Actions = styled.div({
  alignSelf: 'stretch',
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 24,
});

const Error = styled(ErrorMessage)({
  marginTop: 4,
  fontSize: 10,
});

const Button = styled.button({
  backgroundColor: 'transparent',
  border: '0 none',
  outline: 'none',
  appearance: 'none',
  fontWeight: 500,
  fontSize: 12,
  flexBasis: '50%',
  cursor: 'pointer',
  padding: '11px 16px',
  borderRadius: 4,
  textTransform: 'uppercase',
  '&:focus': {
    textDecoration: 'underline',
    fontWeight: 700,
  },
  '&:active': {
    textDecoration: 'underline',
    fontWeight: 700,
  },
  '&[aria-disabled="true"]': {
    cursor: 'default',
  },
});

const Submit = styled(Button)(({ theme }) => ({
  marginRight: 8,
  backgroundColor: theme.color.secondary,
  color: theme.color.inverseText,
  boxShadow: 'rgb(30 167 253 / 10%) 0 0 0 1px inset',
}));

const Reset = styled(Button)(({ theme }) => ({
  marginLeft: 8,
  boxShadow: 'rgb(30 167 253) 0 0 0 1px inset',
  color: theme.color.secondary,
}));
