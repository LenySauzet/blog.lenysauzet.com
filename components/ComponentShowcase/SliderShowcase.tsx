import Slider from '@/components/Slider';

export default function SliderShowcase() {
  return (
    <div className="my-6 flex flex-col gap-4">
      <Slider label="Slider" min={0} max={500} defaultValue={250} decimals={2} />
      <Slider label="Opacity" min={0} max={100} defaultValue={65} unit="%" />
      <Slider label="Stepped" min={0} max={100} step={25} defaultValue={50} />
      <Slider label="Disabled" min={0} max={500} defaultValue={125} disabled />
    </div>
  );
}
