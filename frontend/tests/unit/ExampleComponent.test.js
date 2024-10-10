import React from 'react';
import { render } from '@testing-library/react';

describe('ExampleComponent', () => {
  it('should render correctly', () => {
    //render something
    const { container } = render(<h1>Hello, World!</h1>);
    expect(container).toMatchSnapshot();
  });
});
