import type trTodo from '../tr/todo';

const todo: typeof trTodo = {
  page: {
    title: 'Todo',
    description: 'A simple per-person todo list — don’t forget what needs doing today.',
    newItem: 'New todo',
  },
  filters: {
    status: {
      all: 'All',
      todo: 'To do',
      'in-progress': 'In progress',
      done: 'Done',
    },
    owner: {
      all: 'All owners',
    },
  },
  status: {
    todo: 'To do',
    'in-progress': 'In progress',
    done: 'Done',
  },
  priority: {
    label: 'Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
  form: {
    newTitle: 'New todo',
    editTitle: 'Edit todo',
    fields: {
      title: 'Title',
      titlePlaceholder: 'e.g. Test the retail return flow',
      description: 'Description',
      descriptionPlaceholder: 'Optional detail…',
      owner: 'Owner',
      status: 'Status',
      dueDate: 'Due date',
    },
    titleRequired: 'Title is required',
    ownerRequired: 'Owner is required',
    save: 'Save',
    saving: 'Saving…',
  },
  owner: {
    none: 'No owner selected',
    addNew: 'Add new owner',
    namePlaceholder: 'Owner name',
    add: 'Add',
    nameRequired: 'Name is required',
  },
  list: {
    empty: 'No todos yet.',
    editAria: 'Edit todo',
    deleteAria: 'Delete todo',
    deleteConfirm: 'Delete “{{title}}”?',
  },
};

export default todo;
