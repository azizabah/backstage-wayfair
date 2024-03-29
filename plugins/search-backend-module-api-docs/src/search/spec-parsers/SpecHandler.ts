/*
 * Copyright 2021 The Backstage Authors
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

/**
 * Interface for all Spec Parsers
 *
 * @public
 */
export interface SpecParser {
  readonly specType: string;

  /**
   * Retrieves search result formatted text given
   * a spec definition as input.
   *
   * @public
   */
  getSpecText(specDefinition: string): string;
}

/**
 * Class which stores SpecParsers and retrieves them
 * based on thier type.
 *
 * @public
 */
export class SpecHandler {
  specParsers: Record<string, SpecParser> = {};

  /**
   * Adds a SpecParser.
   * @public
   */
  addSpecParser(parser: SpecParser): SpecHandler {
    this.specParsers[parser.specType] = parser;
    return this;
  }
  /**
   * Retrieves a SpecParser based on it's type.
   * @public
   */
  getSpecParser(specType: string): SpecParser {
    return this.specParsers[specType];
  }
}
