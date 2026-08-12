'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

function Row({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

/** Left column live, right column disabled, as the reference does. */
export default function ToggleShowcase() {
  return (
    <div className="my-6 grid gap-x-4 gap-y-6 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <Row id="cb-off" label="Unchecked">
          <Checkbox id="cb-off" />
        </Row>
        <Row id="cb-on" label="Checked">
          <Checkbox id="cb-on" defaultChecked />
        </Row>
      </div>
      <div className="flex flex-col gap-3">
        <Row id="cb-off-d" label="Unchecked, disabled">
          <Checkbox id="cb-off-d" disabled />
        </Row>
        <Row id="cb-on-d" label="Checked, disabled">
          <Checkbox id="cb-on-d" defaultChecked disabled />
        </Row>
      </div>

      <div className="flex flex-col gap-3">
        <Row id="sw-off" label="Off">
          <Switch id="sw-off" />
        </Row>
        <Row id="sw-on" label="On">
          <Switch id="sw-on" defaultChecked />
        </Row>
      </div>
      <div className="flex flex-col gap-3">
        <Row id="sw-off-d" label="Off, disabled">
          <Switch id="sw-off-d" disabled />
        </Row>
        <Row id="sw-on-d" label="On, disabled">
          <Switch id="sw-on-d" defaultChecked disabled />
        </Row>
      </div>

      <RadioGroup defaultValue="two" className="gap-3">
        <Row id="rd-one" label="First option">
          <RadioGroupItem id="rd-one" value="one" />
        </Row>
        <Row id="rd-two" label="Second option">
          <RadioGroupItem id="rd-two" value="two" />
        </Row>
      </RadioGroup>
      <RadioGroup defaultValue="four" disabled className="gap-3">
        <Row id="rd-three" label="First option, disabled">
          <RadioGroupItem id="rd-three" value="three" />
        </Row>
        <Row id="rd-four" label="Second option, disabled">
          <RadioGroupItem id="rd-four" value="four" />
        </Row>
      </RadioGroup>
    </div>
  );
}
