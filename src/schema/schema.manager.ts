import SchemaRepository from './schema.repository';
import PropertyManager from '../property/property.manager';
import ISchema from './schema.interface';
import IProperty from '../property/property.interface';

export default class SchemaManager {

  static async createSchema(schema: ISchema, schemaProperties: IProperty[]): Promise<ISchema | null> {
    for await (let property of schemaProperties) {
      const createdProperty = await PropertyManager.create(property);
      schema.schemaProperties.push(createdProperty as IProperty);
    }
    return SchemaRepository.createSchema(schema);
  }

  static async deleteSchema(id: string): Promise<ISchema | null> {
    const schema = await SchemaRepository.deleteById(id);

    if (schema) {
      schema.schemaProperties.forEach(async (property: IProperty) => {
        PropertyManager.deleteById(String(property));
      });
    }
    return schema;
  }

  static async deleteProperty(schemaId: string, propertyId: string): Promise<ISchema | null> {
    let hasPropertyFound = false;
    const schema = await SchemaRepository.getById(schemaId);
    const property = await PropertyManager.getById(propertyId);

    if (schema) {
      schema.schemaProperties = schema.schemaProperties.filter(
        (property: IProperty) => {
          if (String(property) === propertyId) {
            hasPropertyFound = true;
            return false;
          }
          return true;
        },
      );
    }
    if (!hasPropertyFound) {
      // throw new PersonNotFoundError();
    }

    if (property) {
      await PropertyManager.deleteById(propertyId);
    }

    return SchemaRepository.updateById(schemaId, schema as ISchema);
  }

  static async getById(schemaId: string): Promise<ISchema | null> {
    const schema = await SchemaRepository.getById(schemaId);
    if (schema === null) {
      // throw new SchemaNotFound();
    }
    return schema;
  }

  static async getAll(): Promise<ISchema[] | null> {
    return await SchemaRepository.getAll();
  }

  static async updateById(id: string, schema: ISchema): Promise<ISchema | null> {
    const prevSchema: ISchema = await SchemaRepository.getById(id) as ISchema;
    const newProperties = [...schema.schemaProperties];
    schema.schemaProperties = [];

    for await (let prevProperty of prevSchema.schemaProperties) {
      await PropertyManager.deleteById(String(prevProperty));
    }

    for await (let property of newProperties) {
      let createdProperty = await PropertyManager.create(property) as IProperty;
      schema.schemaProperties.push(createdProperty);
    }

    return SchemaRepository.updateById(id, schema);
  }
}