import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const QUALITIES = ['Draft', 'Standard', 'High', 'Lossless'];

export default function SelectShowcase() {
  return (
    <div className="my-6 grid gap-x-4 gap-y-6 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="quality">Quality</Label>
        <Select defaultValue="Standard">
          <SelectTrigger id="quality" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUALITIES.map((quality) => (
              <SelectItem key={quality} value={quality}>
                {quality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="quality-empty">Quality, unset</Label>
        <Select>
          <SelectTrigger id="quality-empty" className="w-full">
            <SelectValue placeholder="Pick one" />
          </SelectTrigger>
          <SelectContent>
            {QUALITIES.map((quality) => (
              <SelectItem key={quality} value={quality}>
                {quality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="quality-disabled">Quality, disabled</Label>
        <Select defaultValue="High" disabled>
          <SelectTrigger id="quality-disabled" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUALITIES.map((quality) => (
              <SelectItem key={quality} value={quality}>
                {quality}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
