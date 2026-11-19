import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/LanguageProvider';

type MentorsSearchInputProps = {
  onInput: (value: string) => void;
  value: string;
};

const MentorsSearchInput = (props: MentorsSearchInputProps) => {
  const { t } = useLanguage();
  return (
    <div>
      <Input
        onInput={(event: InputEvent & { currentTarget: HTMLInputElement }) => {
          props.onInput(event.currentTarget.value);
        }}
        placeholder={t().searchPlaceholder}
        type="text"
        value={props.value}
      />
    </div>
  );
};

export default MentorsSearchInput;
