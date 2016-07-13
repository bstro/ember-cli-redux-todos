import redux from 'npm:redux';

import ReduxStore from 'ember-cli-redux/services/redux-store';
import reducer from '../reducers/index';
import emberLoggerMiddleware from 'ember-cli-redux/lib/ember-logger-middleware';
import config from '../config/environment';
import reduxSideEffects from 'npm:redux-side-effects';

const { createEffectCapableStore } = reduxSideEffects;

const { createStore, applyMiddleware } = redux;

const storeFactory = createEffectCapableStore(createStore);

const logger = emberLoggerMiddleware({
  enabled: config.environment === 'dev'
});

export default ReduxStore.extend({
  reducer,

  init() {
    this.__storeFactory = storeFactory;

    this._store = this.__storeFactory(this.get('reducer'));
    
    this._store.subscribe(() => {
      console.log('state change in subscribe')
      this.set('_state', this._store.getState());
      this.notifyPropertyChange('_state');
    });
    
    this.set('_state', this._store.getState());
  },

  middleware: [logger],
});
