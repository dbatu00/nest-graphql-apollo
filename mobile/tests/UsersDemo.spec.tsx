import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import UsersDemo from '../components/UsersDemo';

beforeEach(() => {
  // reset the global fetch mock provided by jest.setup.js
  (global as any).fetch = jest.fn();
  (global as any).confirm = jest.fn(() => true);
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders inputs and buttons', () => {
  const { getByPlaceholderText, getByText } = render(<UsersDemo />);

  expect(getByPlaceholderText('User name')).toBeTruthy();
  expect(getByPlaceholderText('User IDs (comma separated)')).toBeTruthy();
  expect(
    getByPlaceholderText('User IDs or names (comma separated or empty for all users)')
  ).toBeTruthy();

  expect(getByText('Add User')).toBeTruthy();
  expect(getByText('Delete Users')).toBeTruthy();
  expect(getByText('Get Users')).toBeTruthy();
});

test('adds a user and displays result', async () => {
  const newUser = { id: 11, name: 'Alice' };
  (global as any).fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      data: { addUser: { user: newUser, userExists: false } },
    }),
  });

  const { getByPlaceholderText, getByText, findByText } = render(<UsersDemo />);

  fireEvent.changeText(getByPlaceholderText('User name'), 'Alice');
  fireEvent.press(getByText('Add User'));

  // wait for added user card to appear
  await expect(findByText('Alice')).resolves.toBeTruthy();
  await expect(findByText(`ID: ${newUser.id}`)).resolves.toBeTruthy();

  // ensure GraphQL request was made
  expect((global as any).fetch).toHaveBeenCalled();
});

test('gets all users when getUsers input empty', async () => {
  const users = [
    { id: 1, name: 'UserOne' },
    { id: 2, name: 'UserTwo' },
  ];
  (global as any).fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: { getAllUsers: users } }),
  });

  const { getByText, findByText } = render(<UsersDemo />);

  fireEvent.press(getByText('Get Users'));

  await waitFor(async () => {
    expect(await findByText('UserOne')).toBeTruthy();
    expect(await findByText('UserTwo')).toBeTruthy();
  });

  expect((global as any).fetch).toHaveBeenCalled();
});

test('deletes users and displays deleted result', async () => {
  const deleted = [{ id: 5, name: 'DeletedBob' }];

  (global as any).fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: { deleteUser: deleted } }),
  });

  const { getByPlaceholderText, getByText, findByText } = render(<UsersDemo />);

  fireEvent.changeText(getByPlaceholderText('User IDs (comma separated)'), '5');
  fireEvent.press(getByText('Delete Users'));

  await expect(findByText('DeletedBob')).resolves.toBeTruthy();
  await expect(findByText('ID: 5')).resolves.toBeTruthy();

  expect((global as any).fetch).toHaveBeenCalled();
});