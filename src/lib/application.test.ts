import { describe, expect, it } from 'vitest'

import {
  EMPTY_FIELDS,
  MAX_ANSWER_LENGTH,
  MAX_CV_BYTES,
  firstInvalidField,
  normalizeFields,
  normalizeUrl,
  validate,
  validateCv,
} from './application'

const pdf = { name: 'cv.pdf', size: 1024, type: 'application/pdf' }

const validFields = {
  ...EMPTY_FIELDS,
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  github: 'github.com/ada',
  linkedin: 'https://www.linkedin.com/in/ada',
  project: 'ada.dev/analytical-engine',
  answerProject: 'Construí el motor.',
  answerSimplicity: 'Descarté la versión con engranajes extra.',
  answerAi: 'Uso IA para revisar mis notas y verifico cada cálculo.',
}

describe('normalizeUrl', () => {
  it('antepone https:// cuando falta el esquema', () => {
    expect(normalizeUrl('github.com/ada')).toBe('https://github.com/ada')
  })

  it('respeta un esquema existente', () => {
    expect(normalizeUrl('http://github.com/ada')).toBe('http://github.com/ada')
    expect(normalizeUrl('https://github.com/ada')).toBe('https://github.com/ada')
  })

  it('devuelve vacío para un valor vacío', () => {
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('validate', () => {
  it('acepta una postulación completa', () => {
    expect(validate(validFields, pdf)).toEqual({})
  })

  it('exige todos los campos obligatorios', () => {
    const errors = validate(EMPTY_FIELDS, null)
    for (const field of [
      'fullName',
      'email',
      'github',
      'linkedin',
      'project',
      'cv',
      'answerProject',
      'answerSimplicity',
      'answerAi',
    ]) {
      expect(errors).toHaveProperty(field)
    }
  })

  it('rechaza correos mal formados', () => {
    expect(validate({ ...validFields, email: 'ada@' }, pdf).email).toBeDefined()
  })

  it('exige que GitHub sea una URL de github.com', () => {
    expect(
      validate({ ...validFields, github: 'https://gitlab.com/ada' }, pdf).github,
    ).toBeDefined()
    expect(
      validate({ ...validFields, github: 'https://github.com' }, pdf).github,
    ).toBeDefined()
    expect(
      validate({ ...validFields, github: 'no es una url' }, pdf).github,
    ).toBeDefined()
  })

  it('exige que LinkedIn sea una URL de linkedin.com y acepta subdominios', () => {
    expect(
      validate({ ...validFields, linkedin: 'https://x.com/ada' }, pdf).linkedin,
    ).toBeDefined()
    expect(
      validate(
        { ...validFields, linkedin: 'https://cl.linkedin.com/in/ada' },
        pdf,
      ).linkedin,
    ).toBeUndefined()
  })

  it('exige que el proyecto sea una URL válida', () => {
    expect(
      validate({ ...validFields, project: 'mi proyecto' }, pdf).project,
    ).toBeDefined()
    expect(
      validate({ ...validFields, project: 'vercel.com/ada' }, pdf).project,
    ).toBeUndefined()
  })

  it(`limita las respuestas a ${MAX_ANSWER_LENGTH} caracteres`, () => {
    const long = 'a'.repeat(MAX_ANSWER_LENGTH + 1)
    expect(
      validate({ ...validFields, answerProject: long }, pdf).answerProject,
    ).toBeDefined()
    expect(
      validate(
        { ...validFields, answerProject: 'a'.repeat(MAX_ANSWER_LENGTH) },
        pdf,
      ).answerProject,
    ).toBeUndefined()
  })
})

describe('validateCv', () => {
  it('exige un archivo', () => {
    expect(validateCv(null)).toBeDefined()
  })

  it('rechaza lo que no es PDF', () => {
    expect(validateCv({ ...pdf, name: 'cv.docx', type: 'application/msword' }))
      .toBeDefined()
  })

  it('rechaza archivos de más de 10 MB', () => {
    expect(validateCv({ ...pdf, size: MAX_CV_BYTES + 1 })).toBeDefined()
    expect(validateCv({ ...pdf, size: MAX_CV_BYTES })).toBeUndefined()
  })

  it('rechaza archivos vacíos', () => {
    expect(validateCv({ ...pdf, size: 0 })).toBeDefined()
  })
})

describe('normalizeFields', () => {
  it('recorta, normaliza enlaces y baja el correo a minúsculas', () => {
    const result = normalizeFields({
      ...validFields,
      fullName: '  Ada Lovelace  ',
      email: '  Ada@Example.COM ',
      github: 'github.com/ada',
    })
    expect(result.fullName).toBe('Ada Lovelace')
    expect(result.email).toBe('ada@example.com')
    expect(result.github).toBe('https://github.com/ada')
  })
})

describe('firstInvalidField', () => {
  it('devuelve el primer campo inválido en el orden del formulario', () => {
    expect(firstInvalidField({ answerAi: 'x', email: 'x' })).toBe('email')
    expect(firstInvalidField({})).toBeUndefined()
  })
})
