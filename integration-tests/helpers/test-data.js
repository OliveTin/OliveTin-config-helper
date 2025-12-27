export const validYAML = `
actions:
  - title: Test Action
    shell: echo "test"
    icon: test
    id: test-action-1
`;

export const validYAMLComplete = `
actions:
  - title: Test Action 1
    shell: echo "test1"
    icon: test
    id: test-action-1
    timeout: 30
  - title: Test Action 2
    shell: echo "test2"
    icon: test2
    id: test-action-2
entities:
  - file: /path/to/file
    name: Test Entity
dashboards:
  - title: Test Dashboard
    contents:
      - type: action
        id: test-action-1
`;

export const validYAMLMinimal = `
actions: []
`;

export const invalidYAML = `
actions:
  - title: Test Action
    shell: echo "test"
    invalid: [unclosed bracket
`;

export const emptyYAML = '';

export const largeYAML = `
actions:
${Array(1000).fill(0).map((_, i) => `  - title: Action ${i}
    shell: echo "action-${i}"
    icon: test
    id: action-${i}`).join('\n')}
`;

export const validConfig = {
  actions: [
    {
      title: 'Test Action',
      shell: 'echo "test"',
      icon: 'test',
      id: 'test-action-1',
    },
  ],
};

export const validConfigComplete = {
  actions: [
    {
      title: 'Test Action 1',
      shell: 'echo "test1"',
      icon: 'test',
      id: 'test-action-1',
      timeout: 30,
    },
    {
      title: 'Test Action 2',
      shell: 'echo "test2"',
      icon: 'test2',
      id: 'test-action-2',
    },
  ],
  entities: [
    {
      file: '/path/to/file',
      name: 'Test Entity',
    },
  ],
  dashboards: [
    {
      title: 'Test Dashboard',
      contents: [
        {
          type: 'action',
          id: 'test-action-1',
        },
      ],
    },
  ],
};

export const validConfigEmpty = {
  actions: [],
  entities: [],
  dashboards: [],
};

