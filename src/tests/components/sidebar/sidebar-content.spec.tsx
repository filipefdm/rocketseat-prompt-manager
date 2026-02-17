import {
  SidebarContent,
  type SidebarContentProps,
} from '@/components/sidebar/sidebar-content';
import { render, screen } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';

const pushMock = jest.fn();
let mockedSearchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => mockedSearchParams,
}));

const initialPrompts = [
  {
    id: '1',
    title: 'Prompt 1',
    content: 'Conteúdo do Prompt 1',
  },
];

const makeSut = (
  { prompts = initialPrompts }: SidebarContentProps = {} as SidebarContentProps
) => {
  return render(<SidebarContent prompts={prompts} />);
};

describe('SidebarContent', () => {
  const user = userEvent.setup();

  describe('Base', () => {
    it('deveria renderizar o botão para criar um novo prompt', () => {
      makeSut();

      expect(screen.getByRole('complementary')).toBeVisible();
      expect(
        screen.getByRole('button', { name: /novo prompt/i })
      ).toBeInTheDocument();
    });

    it('deveria renderizar a lista de prompts', () => {
      const input = [
        {
          id: '1',
          title: 'Prompt 1',
          content: 'Conteúdo do Prompt 1',
        },
        {
          id: '2',
          title: 'Prompt 2',
          content: 'Conteúdo do Prompt 2',
        },
      ];
      makeSut({ prompts: input });

      expect(screen.getByText(input[0].title)).toBeInTheDocument();
      expect(screen.getAllByRole('paragraph')).toHaveLength(input.length);
    });

    it('deveria atualizar o campo de busca ao digitar', async () => {
      makeSut();

      const searchInput = screen.getByPlaceholderText('Buscar prompts...');

      await user.type(searchInput, 'Prompt 1');

      expect(searchInput).toHaveValue('Prompt 1');
    });
  });

  describe('Colapsar / Expandir', () => {
    it('deveria iniciar expandida e exibir o botão minimizar', () => {
      makeSut();

      const aside = screen.getByRole('complementary');
      expect(aside).toBeVisible();

      const collapseButton = screen.getByRole('button', {
        name: /minimizar sidebar/i,
      });
      expect(collapseButton).toBeVisible();

      const expandButton = screen.queryByRole('button', {
        name: /expandir sidebar/i,
      });
      expect(expandButton).not.toBeInTheDocument();
    });

    it('deveria expandir ao clicar no botão de expandir', async () => {
      makeSut();

      const collapseButton = screen.getByRole('button', {
        name: /minimizar sidebar/i,
      });

      await user.click(collapseButton);

      const expandButton = screen.getByRole('button', {
        name: /expandir sidebar/i,
      });

      await user.click(expandButton);

      const collapseButtonAfterExpand = screen.getByRole('button', {
        name: /minimizar sidebar/i,
      });
      expect(collapseButtonAfterExpand).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', { name: /lista de prompts/i })
      ).toBeInTheDocument();
    });

    it('deveria contrair e mostrar o botão de expandir', async () => {
      makeSut();

      const collapseButton = screen.getByRole('button', {
        name: /minimizar sidebar/i,
      });

      await user.click(collapseButton);

      const expandButton = screen.queryByRole('button', {
        name: /expandir sidebar/i,
      });
      expect(expandButton).toBeInTheDocument();

      expect(collapseButton).not.toBeInTheDocument();
    });

    it('deveria exibir o botão de criar um novo prompt na sidebar minimizada', async () => {
      makeSut();

      const collapseButton = screen.getByRole('button', {
        name: /minimizar sidebar/i,
      });

      await user.click(collapseButton);

      const newButton = screen.getByRole('button', { name: /novo prompt/i });
      expect(newButton).toBeInTheDocument();
    });

    it('não deveria exibir a lista de prompts na sidebar minimizada', async () => {
      makeSut();

      const collapseButton = screen.getByRole('button', {
        name: /minimizar sidebar/i,
      });

      await user.click(collapseButton);

      const promptList = screen.queryByRole('navigation', {
        name: /lista de prompts/i,
      });
      expect(promptList).not.toBeInTheDocument();
    });
  });

  describe('Criar novo prompt', () => {
    it('deveria redirecionar para a página de criação de prompt', async () => {
      makeSut();

      const newButton = screen.getByRole('button', { name: /novo prompt/i });

      await userEvent.click(newButton);

      expect(pushMock).toHaveBeenCalledWith('/new');
    });
  });

  describe('Busca', () => {
    it('deveria navegar com URL codificada ao digitar e limpar', async () => {
      makeSut();

      const searchInput = screen.getByPlaceholderText('Buscar prompts...');

      await user.type(searchInput, 'Prompt 1');

      expect(pushMock).toHaveBeenCalled();
      const lastCall = pushMock.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe('/?q=Prompt%201');

      await user.clear(searchInput);
      const lastClearCall = pushMock.mock.calls.at(-1);
      expect(lastClearCall?.[0]).toBe('/');
    });

    it('deveria submeter o form ao digitar no campo de busca', async () => {
      const submitSpy = jest
        .spyOn(HTMLFormElement.prototype, 'requestSubmit')
        .mockImplementation(() => undefined);
      makeSut();

      const searchInput = screen.getByPlaceholderText('Buscar prompts...');

      await user.type(searchInput, 'Prompt 1');

      expect(submitSpy).toHaveBeenCalled();

      submitSpy.mockRestore();
    });

    it('deveria submeter automaticamente ao montar quando houver query', async () => {
      const submitSpy = jest
        .spyOn(HTMLFormElement.prototype, 'requestSubmit')
        .mockImplementation(() => undefined);

      const text = 'inicial';
      const searchParams = new URLSearchParams(`q=${text}`);
      mockedSearchParams = searchParams;
      makeSut();

      expect(submitSpy).toHaveBeenCalled();

      submitSpy.mockRestore();
    });
  });

  it('deveria iniciar o campo de busca com o search param', () => {
    const text = 'inicial';
    const searchParams = new URLSearchParams(`q=${text}`);
    mockedSearchParams = searchParams;
    makeSut();

    const searchInput = screen.getByPlaceholderText('Buscar prompts...');
    expect(searchInput).toHaveValue(text);
  });
});
