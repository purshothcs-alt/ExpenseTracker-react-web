import {
  Box,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Rating,
  InputAdornment,
} from '@mui/material';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { DynamicFieldDefinition } from '@core/database/types';

type DynamicField = DynamicFieldDefinition;

interface DynamicFormProps<T extends FieldValues> {
  fields: DynamicField[];
  control: Control<T>;
  prefix?: string;
}

export function DynamicFormField<T extends FieldValues>({
  field,
  control,
  name,
}: {
  field: DynamicField;
  control: Control<T>;
  name: Path<T>;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => {
        const commonProps = {
          fullWidth: true,
          label: field.fieldLabel + (field.isRequired ? ' *' : ''),
          error: !!fieldState.error,
          helperText: fieldState.error?.message || field.helpText,
        };

        switch (field.fieldType) {
          case 'text':
            return <TextField {...f} {...commonProps} value={f.value ?? ''} />;

          case 'number':
            return (
              <TextField
                {...f}
                {...commonProps}
                type="number"
                value={f.value ?? ''}
                onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                InputProps={
                  field.placeholder
                    ? {
                        startAdornment: (
                          <InputAdornment position="start">{field.placeholder}</InputAdornment>
                        ),
                      }
                    : undefined
                }
              />
            );

          case 'textarea':
            return <TextField {...f} {...commonProps} multiline rows={3} value={f.value ?? ''} />;

          case 'date':
            return (
              <TextField
                {...f}
                {...commonProps}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={f.value ?? ''}
              />
            );

          case 'datetime':
            return (
              <TextField
                {...f}
                {...commonProps}
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={f.value ?? ''}
              />
            );

          case 'boolean':
            return (
              <FormControlLabel
                control={
                  <Switch checked={!!f.value} onChange={(e) => f.onChange(e.target.checked)} />
                }
                label={field.fieldLabel + (field.isRequired ? ' *' : '')}
              />
            );

          case 'select': {
            const opts = field.options
              ? (JSON.parse(field.options as unknown as string) as string[])
              : [];
            return (
              <TextField {...f} {...commonProps} select value={f.value ?? ''}>
                {opts.map((o: string) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            );
          }

          case 'multiselect': {
            const opts = field.options
              ? (JSON.parse(field.options as unknown as string) as string[])
              : [];
            const selected: string[] = Array.isArray(f.value) ? f.value : [];
            return (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {field.fieldLabel}
                </Typography>
                <FormGroup row>
                  {opts.map((o: string) => (
                    <FormControlLabel
                      key={o}
                      control={
                        <Checkbox
                          checked={selected.includes(o)}
                          onChange={(e) => {
                            if (e.target.checked) f.onChange([...selected, o]);
                            else f.onChange(selected.filter((s) => s !== o));
                          }}
                        />
                      }
                      label={o}
                    />
                  ))}
                </FormGroup>
                {fieldState.error && (
                  <Typography variant="caption" color="error">
                    {fieldState.error.message}
                  </Typography>
                )}
              </Box>
            );
          }

          case 'currency':
            return (
              <TextField
                {...f}
                {...commonProps}
                type="number"
                value={f.value ?? ''}
                onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
            );

          case 'percentage':
            return (
              <TextField
                {...f}
                {...commonProps}
                type="number"
                value={f.value ?? ''}
                onChange={(e) => f.onChange(parseFloat(e.target.value) || 0)}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            );

          case 'rating':
            return (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {field.fieldLabel}
                </Typography>
                <Rating value={f.value ?? 0} onChange={(_, v) => f.onChange(v)} max={5} />
                {fieldState.error && (
                  <Typography variant="caption" color="error">
                    {fieldState.error.message}
                  </Typography>
                )}
              </Box>
            );

          case 'url':
            return (
              <TextField
                {...f}
                {...commonProps}
                type="url"
                value={f.value ?? ''}
                placeholder="https://"
              />
            );

          case 'email':
            return <TextField {...f} {...commonProps} type="email" value={f.value ?? ''} />;

          case 'phone':
            return <TextField {...f} {...commonProps} type="tel" value={f.value ?? ''} />;

          default:
            return <TextField {...f} {...commonProps} value={f.value ?? ''} />;
        }
      }}
    />
  );
}

export function DynamicForm<T extends FieldValues>({
  fields,
  control,
  prefix = 'dynamicFields',
}: DynamicFormProps<T>) {
  const sortedFields = [...fields].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (sortedFields.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        textTransform="uppercase"
        letterSpacing={0.5}
      >
        Additional Fields
      </Typography>
      <Box display="flex" flexDirection="column" gap={2} mt={1}>
        {sortedFields.map((field) => (
          <DynamicFormField
            key={field.id}
            field={field}
            control={control}
            name={`${prefix}.${field.fieldName}` as Path<T>}
          />
        ))}
      </Box>
    </Box>
  );
}
