/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { JsonObject } from '@backstage/types';
import { NextCustomFieldValidator } from '../../extensions';
import { createAsyncValidators } from './createAsyncValidators';

describe('createAsyncValidators', () => {
  it('should call the correct functions for validation', async () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          'ui:field': 'NameField',
        },
        address: {
          type: 'object',
          'ui:field': 'AddressField',
          properties: {
            street: {
              type: 'string',
            },
            postcode: {
              type: 'string',
            },
          },
        },
      },
    };

    const validators = { NameField: jest.fn(), AddressField: jest.fn() };

    const validate = createAsyncValidators(schema, validators, {
      apiHolder: { get: jest.fn() },
    });

    await validate({
      name: 'asd',
      address: { street: 'street', postcode: 'postcode' },
    });

    expect(validators.NameField).toHaveBeenCalled();
    expect(validators.AddressField).toHaveBeenCalled();
  });

  it('should return the correct errors to the frontend', async () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          'ui:field': 'NameField',
        },
        address: {
          type: 'object',
          'ui:field': 'AddressField',
          properties: {
            street: {
              type: 'string',
            },
            postcode: {
              type: 'string',
            },
          },
        },
      },
    };

    const NameField: NextCustomFieldValidator<string> = (
      value,
      { addError },
    ) => {
      if (!value) {
        addError('something is broken here!');
      }
    };

    const AddressField: NextCustomFieldValidator<{
      street?: string;
      postcode?: string;
    }> = (value, { addError }) => {
      if (!value.postcode) {
        addError('postcode is missing!');
      }

      if (!value.street) {
        addError('street is missing here!');
      }
    };

    const validate = createAsyncValidators(
      schema,
      {
        NameField: NameField as NextCustomFieldValidator<unknown>,
        AddressField: AddressField as NextCustomFieldValidator<unknown>,
      },
      {
        apiHolder: { get: jest.fn() },
      },
    );

    await expect(
      validate({
        name: 'asd',
        address: { street: 'street', postcode: 'postcode' },
      }),
    ).resolves.toEqual({
      name: expect.objectContaining({
        __errors: [],
      }),
      address: expect.objectContaining({
        __errors: [],
      }),
    });

    await expect(
      validate({
        name: 'asd',
        address: { street: '', postcode: 'postcode' },
      }),
    ).resolves.toEqual({
      name: expect.objectContaining({
        __errors: [],
      }),
      address: expect.objectContaining({
        __errors: ['street is missing here!'],
      }),
    });

    await expect(
      validate({
        name: '',
        address: { street: '', postcode: '' },
      }),
    ).resolves.toEqual({
      name: expect.objectContaining({
        __errors: ['something is broken here!'],
      }),
      address: expect.objectContaining({
        __errors: ['postcode is missing!', 'street is missing here!'],
      }),
    });
  });

  it('should run validation on complex nested schemas', async () => {
    const schema: JsonObject = {
      title: 'Select component',
      properties: {
        actionType: {
          title: 'action type',
          type: 'string',
          description: 'Select the action type',
          enum: ['newThing', 'existingThing'],
          enumNames: ['New thing', 'Existing thing'],
          default: 'newThing',
        },
      },
      required: ['actionType'],
      dependencies: {
        actionType: {
          oneOf: [
            {
              properties: {
                actionType: {
                  enum: ['newThing'],
                },
                general: {
                  title: 'General',
                  type: 'object',
                  properties: {
                    address: {
                      type: 'object',
                      'ui:field': 'AddressField',
                      properties: {
                        street: {
                          type: 'string',
                        },
                        postcode: {
                          type: 'string',
                        },
                      },
                    },
                    name: {
                      title: 'Name',
                      type: 'string',
                      'ui:field': 'NameField',
                    },
                  },
                },
              },
            },
            {
              properties: {
                actionType: {
                  enum: ['existingThing'],
                },
                thingId: {
                  title: 'Thing id',
                  type: 'string',
                  description: 'Enter thing id',
                },
              },
            },
          ],
        },
      },
    };

    const AddressField: NextCustomFieldValidator<{
      street?: string;
      postcode?: string;
    }> = (value, { addError }) => {
      if (!value.postcode) {
        addError('postcode is missing!');
      }

      if (!value.street) {
        addError('street is missing here!');
      }
    };

    const NameField: NextCustomFieldValidator<string> = (
      value,
      { addError },
    ) => {
      if (!value) {
        addError('something is broken here!');
      }
    };

    const validators = {
      AddressField: AddressField as NextCustomFieldValidator<unknown>,
      NameField: NameField as NextCustomFieldValidator<unknown>,
    };

    const validate = createAsyncValidators(schema, validators, {
      apiHolder: { get: jest.fn() },
    });

    await expect(
      validate({
        actionType: 'newThing',
        general: {
          address: {
            street: 'street',
            postcode: 'postcode',
          },
          name: undefined,
        },
      }),
    ).resolves.toEqual({
      general: {
        address: expect.objectContaining({
          __errors: [],
        }),
        name: expect.objectContaining({
          __errors: ['something is broken here!'],
        }),
      },
    });
  });

  it('should call a validator for array property from a custom field extension', async () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        tags: {
          title: 'Tags',
          type: 'array',
          items: {
            type: 'string',
            'ui:field': 'TagField',
          },
        },
      },
    };

    const validators = { TagField: jest.fn() };

    const validate = createAsyncValidators(schema, validators, {
      apiHolder: { get: jest.fn() },
    });

    await validate({
      tags: ['tag-1', 'tag-2'],
    });

    expect(validators.TagField).toHaveBeenCalled();
  });

  it('should does not call a validator if no ui field specified', async () => {
    const schema: JsonObject = {
      type: 'object',
      properties: {
        tags: {
          title: 'Tags',
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    };

    const validators = { TagField: jest.fn() };

    const validate = createAsyncValidators(schema, validators, {
      apiHolder: { get: jest.fn() },
    });

    await validate({
      tags: ['asd', 'asd$'],
    });

    expect(validators.TagField).not.toHaveBeenCalled();
  });
});
