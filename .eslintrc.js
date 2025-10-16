module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // 禁用不必要的catch警告
    'no-useless-catch': 'off',

    // 其他个人偏好配置
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // Vue相关规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',

    // 代码风格
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],

    // 变量声明
    'no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],

    // 函数相关
    'no-empty-function': 'warn',
    'prefer-const': 'error',

    // 对象和数组
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // 字符串
    'template-curly-spacing': ['error', 'never'],

    // 其他
    'no-trailing-spaces': 'error',
    'eol-last': 'error'
  }
}
