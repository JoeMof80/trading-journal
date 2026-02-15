import { FlagColor } from "@/types/types";
import { FlagIcon } from "./FlagIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FLAG_COLORS, getFlagOption } from "@/lib/constants";

export function RowFlagPicker({
  flag,
  onChange,
}: {
  flag: FlagColor;
  onChange: (c: FlagColor) => void;
}) {
  const current = getFlagOption(flag);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="flex items-center justify-center h-6 w-6 rounded-sm hover:bg-accent cursor-pointer"
          title={flag === "none" ? "Set flag" : `Flag: ${current.label}`}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.click()}
        >
          <FlagIcon
            className={`transition-colors ${current.iconClass}`}
            filled={flag !== "none"}
            size={16}
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={6}
        alignOffset={-7}
        className="flex flex-row p-1"
      >
        {FLAG_COLORS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onChange(flag === opt.value ? "none" : opt.value)}
            title={opt.label}
            className={`flex items-center justify-center p-1.5 cursor-pointer rounded
              ${flag === opt.value ? "bg-muted ring-1 ring-inset ring-border" : ""}`}
          >
            <FlagIcon
              className={`shrink-0 ${opt.iconClass}`}
              filled
              size={13}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
