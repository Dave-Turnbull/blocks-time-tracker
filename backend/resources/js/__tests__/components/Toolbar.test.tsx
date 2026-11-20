import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Toolbar } from '../../components/Toolbar';
import { ToolbarContext } from '../../contexts/ToolbarContext';
import { AuthContext } from '../../contexts/AuthContext';

function renderToolbar(ctxOverrides: Record<string, unknown> = {}) {
  const goToDate = vi.fn();
  render(
    <AuthContext.Provider
      value={{
        user: { id: 1, name: 'Dave', email: 'dave@example.com' },
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        loginWithToken: vi.fn(),
      } as any}
    >
      <ToolbarContext.Provider
        value={{
          inputValue: 15,
          setInputValue: vi.fn(),
          setMinuteInput: vi.fn(),
          goToTarget: { date: '2026-06-28', nonce: 0 },
          goToDate,
          eraseTool: false,
          setEraseTool: vi.fn(),
          isDark: false,
          toggleTheme: vi.fn(),
          tasks: {},
          selectedTaskId: null,
          setSelectedTaskId: vi.fn(),
          taskMruOrder: [],
          ...ctxOverrides,
        } as any}
      >
        <Toolbar />
      </ToolbarContext.Provider>
    </AuthContext.Provider>
  );
  return { goToDate };
}

describe('Toolbar go-to date', () => {
  it('initialises the input from the current go-to target', () => {
    renderToolbar();
    expect(screen.getByLabelText('Go to')).toHaveValue('2026-06-28');
  });

  it('fires goToDate with the chosen date on submit', () => {
    const { goToDate } = renderToolbar();
    fireEvent.change(screen.getByLabelText('Go to'), { target: { value: '2026-07-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(goToDate).toHaveBeenCalledWith('2026-07-15');
  });

  it('does not fire goToDate when the input is empty', () => {
    const { goToDate } = renderToolbar();
    fireEvent.change(screen.getByLabelText('Go to'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(goToDate).not.toHaveBeenCalled();
  });
});
