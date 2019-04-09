// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {intercept} from '@loopback/context';
import {get, param} from '@loopback/openapi-v3';
import {
  Client,
  createRestAppClient,
  expect,
  givenHttpServerConfig,
} from '@loopback/testlab';
import {RestApplication} from '../../..';
import {
  cache,
  cachedResults,
  CachingInterceptorProvider,
  clearCache,
  status,
} from './caching-interceptor';

describe('caching interceptor', () => {
  let client: Client;
  let app: RestApplication;

  before(givenAClient);
  after(async () => {
    await app.stop();
  });

  context('toUpperCase with bound caching interceptor', () => {
    it('invokes the controller method if not cached', async () => {
      await client.get('/toUpperCase/Hello').expect(200, 'HELLO');
      expect(status.returnFromCache).to.be.false();
    });

    it('returns from cache without invoking the controller method', async () => {
      for (let i = 0; i <= 5; i++) {
        await client.get('/toUpperCase/Hello').expect(200, 'HELLO');
        expect(status.returnFromCache).to.be.true();
      }
    });

    it('invokes the controller method after cache is cleared', async () => {
      clearCache();
      await client.get('/toUpperCase/Hello').expect(200, 'HELLO');
      expect(status.returnFromCache).to.be.false();
    });
  });

  context('toLowerCase with cache interceptor function', () => {
    it('invokes the controller method if not cached', async () => {
      await client.get('/toLowerCase/Hello').expect(200, 'hello');
      expect(status.returnFromCache).to.be.false();
    });

    it('returns from cache without invoking the controller method', async () => {
      for (let i = 0; i <= 5; i++) {
        await client.get('/toLowerCase/Hello').expect(200, 'hello');
        expect(status.returnFromCache).to.be.true();
      }
    });

    it('invokes the controller method after cache is cleared', async () => {
      cachedResults.clear();
      await client.get('/toLowerCase/Hello').expect(200, 'hello');
      expect(status.returnFromCache).to.be.false();
    });
  });

  async function givenAClient() {
    clearCache();
    app = new RestApplication({rest: givenHttpServerConfig()});
    app.bind('caching-interceptor').toProvider(CachingInterceptorProvider);
    app.controller(StringCaseController);
    await app.start();
    client = createRestAppClient(app);
  }

  /**
   * A controller using interceptors for caching
   */
  class StringCaseController {
    @intercept('caching-interceptor')
    @get('/toUpperCase/{text}')
    toUpperCase(@param.path.string('text') text: string) {
      return text.toUpperCase();
    }

    @intercept(cache)
    @get('/toLowerCase/{text}')
    toLowerCase(@param.path.string('text') text: string) {
      return text.toLowerCase();
    }
  }
});