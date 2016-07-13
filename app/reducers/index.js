import redux from 'npm:redux';
import reduxSideEffects from 'npm:redux-side-effects';

import todo from './todo';

const { combineReducers } = reduxSideEffects

export default combineReducers({
    todo
});
