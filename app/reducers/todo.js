import Ember from 'ember';
import reduxSideEffects from 'npm:redux-side-effects';
// import todoEffects from 'todoEffects'

const {sideEffect} = reduxSideEffects;

const initialState = Ember.Object.create({
  todos: Ember.A(),
  filter: 'all',
  editingTodo: null,
  newTitle: ""
});

// Might want to modify sideEffect to take dispatch as final argument so 
// we don't have to do this for every mutative Ember object method.
const $set = (dispatch, ...rest) => Ember.set(...rest);
const $save = (dispatch, model) => model.save();

export default function* todo(state, action = {}) {
  state = state || Ember.Object.create({}, initialState);
  
  switch (action.type) {
    case 'SET_FILTER':
      state.setProperties({filter: action.filter})
      return state;

    case 'RECEIVE_TODOS':
      state.setProperties({todos: action.todos.toArray()})
      return state;

    case 'CREATE_TODO':
      if (action.title && !action.title.trim()) {
        state.setProperties({newTitle: ''})
        return Ember.Object.create({}, state);
      }

      let newTodo = action.store.createRecord('todo', {
        title: action.title.trim()
      });

      yield sideEffect($save, newTodo);
      state.setProperties({newTitle: ''});
      state.todos.pushObject(newTodo);

      return Ember.Object.create({}, state);

    case 'EDIT_TODO':
      state.setProperties({editingTodo: action.todo})
      return Ember.Object.create({}, state);

    case 'UPDATE_TODO':
      yield sideEffect($set, action.todo, 'title', action.title);
      
      yield sideEffect($save, action.todo);

      state.setProperties({editingTodo: null});
      return Ember.Object.create({}, state);

    case 'REMOVE_TODO':
      yield sideEffect(action.todo.destroyRecord.bind(action.todo));
      const remaining = state.todos.filter(todo => todo !== action.todo);
      state.setProperties({todos: remaining});      
      return Ember.Object.create({}, state);

    case 'TOGGLE_COMPLETED':
      yield sideEffect(toggleTodo, action.todo);
      yield sideEffect($save, action.todo);
      return Ember.Object.create({}, state);

    case 'COMPLETE_ALL':
      const allAreDone = state.todos.every((todo) => todo.get('isCompleted'));
      yield sideEffect(completeTodos, state.todos, allAreDone);
      state.setProperties({todos: state.todos});
      return Ember.Object.create({}, state);

    case 'CLEAR_COMPLETED':
      const completed = state.todos.filter((todo) => todo.get('isCompleted'));
      const uncompleted = state.todos.filter((todo) => !todo.get('isCompleted'));

      yield sideEffect(destroyRecords, completed);

      state.set('todos', uncompleted);
      return Ember.Object.create({}, state);

  default:
    return state;
  }
}

function toggleTodo(dispatch, todo) {
  todo.toggleProperty('isCompleted');
}

function completeTodos(dispatch, todos, completionState) {
  todos.map((todo) => {
    todo.set('isCompleted', !completionState);
    return todo;
  });
}

function destroyRecords(dispatch, records) {
  records.forEach((record) => {
    destroyRecord(dispatch, record);
  });
}

function destroyRecord(dispatch, record) {
  record.destroyRecord();
}
