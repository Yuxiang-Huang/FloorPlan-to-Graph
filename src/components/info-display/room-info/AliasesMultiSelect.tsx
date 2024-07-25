import React, { KeyboardEventHandler, useContext } from "react";
import CreatableSelect from "react-select/creatable";
import { selectStyle } from "../../shared/selectStyle";
import { ShortcutsStatusContext } from "../../contexts/ShortcutsStatusProvider";
import { toast } from "react-toastify";
import { RoomInfo } from "../../shared/types";

const components = {
  DropdownIndicator: null,
};

interface Option {
  readonly label: string;
  readonly value: string;
}

const createOption = (label: string) => ({
  label,
  value: label,
});

interface Props {
  room: RoomInfo;
  handleSaveHelper: (newRoomInfo: RoomInfo) => void;
}

const AliasesMultiSelect = ({ room, handleSaveHelper }: Props) => {
  const { setShortcutsDisabled } = useContext(ShortcutsStatusContext);

  const saveAliasesHelper = (value) => {
    const newRoomInfo = { ...room, aliases: value.map((elem) => elem.value) };
    handleSaveHelper(newRoomInfo);
  };

  const [inputValue, setInputValue] = React.useState("");
  const [value, setValue] = React.useState<readonly Option[]>(
    room.aliases.map((a) => ({ label: a, value: a }))
  );

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;
    switch (event.key) {
      case "Enter":
      case "Tab":
        if (value.some((elem) => elem.value === inputValue)) {
          toast.error("Don't add duplicated aliases!");
          return;
        }
        setValue([...value, createOption(inputValue)]);
        saveAliasesHelper([...value, createOption(inputValue)]);
        setInputValue("");
        event.preventDefault();
    }
  };

  return (
    <CreatableSelect
      components={components}
      inputValue={inputValue}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={(newValue) => {
        saveAliasesHelper([...value, createOption(inputValue)]);
        setValue(newValue);
      }}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      placeholder="None"
      value={value}
      onFocus={() => {
        setShortcutsDisabled(true);
      }}
      onBlur={() => {
        setShortcutsDisabled(false);
      }}
      styles={selectStyle}
    />
  );
};

export default AliasesMultiSelect;
