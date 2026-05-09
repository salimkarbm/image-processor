// Prevent console spam in tests (optional)
jest.spyOn(console, 'log').mockImplementation(() => {});

jest.spyOn(console, 'error').mockImplementation(() => {});
