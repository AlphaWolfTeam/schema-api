import {
  SchemaNotFoundError,
  PropertyNotInSchemaError,
  InvalidValueInPropertyError,
  DuplicatePropertyNameError,
  DuplicateSchemaNameError,
} from "../src/utils/errors/user";
import chai from "chai";
import mongoose from "mongoose";
import config from "../src/config/index";
import SchemaModel from "../src/schema/schema.model";
import SchemaManager from "../src/schema/schema.manager";
import ISchema from "../src/schema/schema.interface";
import { InvalidIdError } from "../src/utils/errors/user";
import {
  schemaExample,
  propertyNumberExample,
  ID_NOT_EXIST,
  INVALID_ID,
  propertyObjectIdExample,
} from "./dataExamples";
import PropertyModel from "../src/property/property.model";
import IProperty from "../src/property/property.interface";
import PropertyManager from "../src/property/property.manager";
// import { initRabbit } from "../src/utils/rabbitmq/rabbit";

const { expect } = chai;
const { test } = config;

describe("Schema Manager", () => {
  before(async () => {
    // await initRabbit(
    //   test.rabbit.uri,
    //   test.rabbit.retryOptions,
    //   test.rabbit.queueName
    // );
    await mongoose.connect(test.mongo.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
  });

  after(async () => {
    await mongoose.connection.close();
  });

  describe("Create", () => {
    afterEach(async () => {
      await SchemaModel.deleteMany({}).exec();
    });

    context("Valid Schema", () => {
      it("Should create schema", async () => {
        const schema = (await SchemaManager.create(
          { ...schemaExample },
          []
        )) as ISchema;

        expect(schema).to.exist;
        expect(schema).to.have.property("_id");
        expect(schema).to.have.property("schemaName", schemaExample.schemaName);
        expect(JSON.stringify(schema.schemaProperties)).to.equals(
          JSON.stringify(schemaExample.schemaProperties)
        );
      });
    });

    context("Duplicate property names", () => {
      it("Should throw an DuplicatePropertyNameError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.create({ ...schemaExample }, [
            { ...propertyNumberExample },
            { ...propertyNumberExample },
          ]);
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof DuplicatePropertyNameError).to.be
            .true;
        }
      });
    });

    context("Duplicate schema names", () => {
      it("Should throw an DuplicateSchemaNameError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.create({ ...schemaExample }, []);
          await SchemaManager.create({ ...schemaExample }, []);
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof DuplicateSchemaNameError).to.be.true;
        }
      });
    });
  });

  describe("Get by id", () => {
    let schema: ISchema;
    beforeEach(async () => {
      schema = (await SchemaManager.create(
        { ...schemaExample },
        []
      )) as ISchema;
    });

    afterEach(async () => {
      await SchemaModel.deleteMany({}).exec();
    });

    context("Valid id", () => {
      it("Should return schema", async () => {
        const newSchema = (await SchemaManager.getById(
          schema._id as string
        )) as ISchema;
        expect(newSchema).to.exist;
        expect(newSchema).to.have.property("_id");
        expect(newSchema).to.have.property("schemaName", schema.schemaName);
        expect(JSON.stringify(newSchema.schemaProperties)).to.equals(
          JSON.stringify(schema.schemaProperties)
        );
        expect(JSON.stringify(newSchema.createdAt)).to.equals(
          JSON.stringify(schema.createdAt)
        );
        expect(JSON.stringify(newSchema.updatedAt)).to.equals(
          JSON.stringify(schema.updatedAt)
        );
      });
    });

    context("Invalid id", () => {
      it("Should throw an InvalidIdError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.getById(INVALID_ID);
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof InvalidIdError).to.be.true;
        }
      });
    });

    context("Schema not found", () => {
      it("Should throw an SchemaNotFoundError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.getById(ID_NOT_EXIST);
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof SchemaNotFoundError).to.be.true;
        }
      });
    });
  });

  describe("Get all", () => {
    let schemas: ISchema[] = [];
    const NEW_SCHEMA_NAME = "second schema name";

    beforeEach(async () => {
      schemas.push(
        (await SchemaManager.create({ ...schemaExample }, [])) as ISchema
      );
      schemas.push(
        (await SchemaManager.create(
          { ...schemaExample, schemaName: NEW_SCHEMA_NAME },
          []
        )) as ISchema
      );
    });

    afterEach(async () => {
      await SchemaModel.deleteMany({}).exec();
    });

    it("Should return schemas list", async () => {
      const schemasArray: ISchema[] = (await SchemaManager.getAll()) as ISchema[];

      expect(schemasArray).to.exist;
      schemasArray.map((schema: ISchema) => {
        expect(schema).to.have.property("_id");
        expect(schema).to.have.property("schemaName", schema.schemaName);
        expect(JSON.stringify(schema.schemaProperties)).to.equals(
          JSON.stringify(schema.schemaProperties)
        );
        expect(JSON.stringify(schema.createdAt)).to.equals(
          JSON.stringify(schema.createdAt)
        );
        expect(JSON.stringify(schema.updatedAt)).to.equals(
          JSON.stringify(schema.updatedAt)
        );
      });
    });
  });

  describe("Delete schema", () => {
    let schema: ISchema;

    beforeEach(async () => {
      schema = (await SchemaManager.create(
        { ...schemaExample },
        []
      )) as ISchema;
    });

    afterEach(async () => {
      await SchemaModel.deleteMany({}).exec();
    });

    context("Valid id", () => {
      it("Should delete schema", async () => {
        await SchemaManager.deleteSchema(schema._id as string);
        const schemasList = (await SchemaManager.getAll()) as ISchema[];
        expect(schemasList.length).to.equal(0);
      });
    });

    context("Invalid id", () => {
      it("Should throw an InvalidIdError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.deleteSchema(INVALID_ID);
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof InvalidIdError).to.be.true;
        }
      });
    });

    context("Schema not found", () => {
      it("Should throw an SchemaNotFoundError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.deleteSchema(ID_NOT_EXIST);
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof SchemaNotFoundError).to.be.true;
        }
      });
    });
  });

  describe("Delete property", () => {
    let schema: ISchema;

    beforeEach(async () => {
      schema = (await SchemaManager.create({ ...schemaExample }, [
        { ...propertyNumberExample },
      ])) as ISchema;
    });

    afterEach(async () => {
      await SchemaModel.deleteMany({}).exec();
      await PropertyModel.deleteMany({}).exec();
    });

    context("Valid id", () => {
      it("Should delete property", async () => {
        await SchemaManager.deleteProperty(
          schema._id as string,
          schema.schemaProperties[0]._id as string
        );
        const propertyList = await PropertyModel.find().exec();
        expect(propertyList.length).to.equal(0);
      });
    });

    context("Invalid schema id", () => {
      it("Should throw an InvalidIdError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.deleteProperty(
            INVALID_ID,
            String(schema.schemaProperties[0])
          );
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof InvalidIdError).to.be.true;
        }
      });
    });

    context("Schema not found", () => {
      it("Should throw an SchemaNotFoundError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.deleteProperty(
            ID_NOT_EXIST,
            String(schema.schemaProperties[0])
          );
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof SchemaNotFoundError).to.be.true;
        }
      });
    });

    context("Property that not exist in schema", () => {
      let property: IProperty;

      beforeEach(async () => {
        property = (await PropertyManager.create({
          ...propertyNumberExample,
        })) as IProperty;
      });

      afterEach(async () => {
        await PropertyManager.deleteById(property._id as string);
      });

      it("Should throw an PropertyNotInSchemaError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.deleteProperty(
            schema._id as string,
            property._id as string
          );
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof PropertyNotInSchemaError).to.be.true;
        }
      });
    });
  });

  describe("Update schema", () => {
    let schema: ISchema, property: IProperty;
    const NEW_NAME: string = "new";
    const newSchema: ISchema = { ...schemaExample, schemaName: NEW_NAME };

    beforeEach(async () => {
      schema = (await SchemaManager.create({ ...schemaExample }, [
        { ...propertyNumberExample },
      ])) as ISchema;
      property = (await PropertyManager.getById(
        schema.schemaProperties[0]._id as string
      )) as IProperty;
    });

    afterEach(async () => {
      await SchemaModel.deleteMany({}).exec();
      await PropertyModel.deleteMany({}).exec();
    });

    context("Valid id", () => {
      it("Should update schema with no properties", async () => {
        (await SchemaManager.updateById(
          schema._id as string,
          newSchema
        )) as ISchema;
        const updatedSchema = await SchemaManager.getById(schema._id as string);
        expect(updatedSchema).to.exist;
        expect(updatedSchema).to.have.property("schemaName", NEW_NAME);
      });

      it("Should update property ref", async () => {
        const secondProperty = (await PropertyManager.create({
          ...propertyObjectIdExample,
          propertyRef: schema.schemaName,
        })) as IProperty;
        (await SchemaManager.updateById(
          schema._id as string,
          newSchema
        )) as ISchema;
        expect(
          (await PropertyManager.getById(secondProperty._id as string))
            ?.propertyRef
        ).to.be.equal(newSchema.schemaName);
      });

      it("Should update schema and create property", async () => {
        (await SchemaManager.updateById(schema._id as string, {
          ...newSchema,
          schemaProperties: [{ ...propertyNumberExample }],
        })) as ISchema;
        const res = (await SchemaManager.getById(
          schema._id as string
        )) as ISchema;

        expect(res).to.exist;
        expect(res).to.have.property("schemaName", NEW_NAME);
        expect(res.schemaProperties.length).to.equals(1);

        const resProperty = res.schemaProperties[0];

        expect(String(resProperty._id)).to.not.equals(String(property._id));
        expect(resProperty).to.have.property(
          "propertyName",
          propertyNumberExample.propertyName
        );
        expect(resProperty).to.have.property(
          "propertyType",
          propertyNumberExample.propertyType
        );
        expect(resProperty).to.have.property(
          "defaultValue",
          propertyNumberExample.defaultValue
        );
        expect(resProperty).to.have.property(
          "propertyRef",
          propertyNumberExample.propertyRef
        );
        expect(JSON.stringify(resProperty.enum)).to.equals(
          JSON.stringify(propertyNumberExample.enum)
        );
        expect(resProperty).to.have.property(
          "isUnique",
          propertyNumberExample.isUnique
        );
        expect(resProperty).to.have.property(
          "index",
          propertyNumberExample.index
        );
        expect(resProperty).to.have.property(
          "required",
          propertyNumberExample.required
        );
      });

      it("Should update schema and update property", async () => {
        (await SchemaManager.updateById(schema._id as string, {
          ...newSchema,
          schemaProperties: [
            {
              ...propertyNumberExample,
              _id: String(property._id),
              propertyName: NEW_NAME,
              createdAt: property.createdAt,
            },
          ],
        })) as ISchema;
        const res = (await SchemaManager.getById(
          schema._id as string
        )) as ISchema;

        expect(res).to.exist;
        expect(res).to.have.property("schemaName", NEW_NAME);
        expect(res.schemaProperties.length).to.equals(1);

        const resProperty = res.schemaProperties[0];

        expect(String(resProperty._id)).to.equals(String(property._id));
        expect(resProperty).to.have.property("propertyName", NEW_NAME);
        expect(resProperty).to.have.property(
          "propertyType",
          propertyNumberExample.propertyType
        );
        expect(resProperty).to.have.property(
          "defaultValue",
          propertyNumberExample.defaultValue
        );
        expect(resProperty).to.have.property(
          "propertyRef",
          propertyNumberExample.propertyRef
        );
        expect(JSON.stringify(resProperty.enum)).to.equals(
          JSON.stringify(propertyNumberExample.enum)
        );
        expect(resProperty).to.have.property(
          "isUnique",
          propertyNumberExample.isUnique
        );
        expect(resProperty).to.have.property(
          "index",
          propertyNumberExample.index
        );
        expect(resProperty).to.have.property(
          "required",
          propertyNumberExample.required
        );
        expect(JSON.stringify(resProperty.createdAt)).to.equals(
          JSON.stringify(property.createdAt)
        );
      });
    });

    context("Duplicate property names", () => {
      it("Should throw an DuplicatePropertyNameError", async () => {
        let functionError: Object = {};
        try {
          (await SchemaManager.updateById(schema._id as string, {
            ...newSchema,
            schemaProperties: [
              { ...propertyNumberExample },
              { ...propertyNumberExample },
            ],
          })) as ISchema;
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof DuplicatePropertyNameError).to.be
            .true;
        }
      });
    });

    context("Duplicate schema names", () => {
      const ANOTHER_SCHEMA_NAME = "anotherName";

      beforeEach(async () => {
        await SchemaManager.create(
          {
            ...schemaExample,
            schemaName: ANOTHER_SCHEMA_NAME,
          },
          []
        );
      });

      afterEach(async () => {
        await SchemaModel.deleteMany({}).exec();
      });

      it("Should throw an DuplicateSchemaNameError", async () => {
        let functionError: Object = {};
        try {
          await SchemaManager.updateById(schema._id as string, {
            ...schemaExample,
            schemaName: ANOTHER_SCHEMA_NAME,
          });
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof DuplicateSchemaNameError).to.be.true;
          expect((await PropertyModel.find({}).exec()).length).to.equal(
            schema.schemaProperties.length
          );
          const prevProperty = {
            ...((await PropertyModel.findById(property._id).exec()) as Object)[
              "_doc"
            ],
            updatedAt: undefined,
            createdAt: undefined,
          };
          const updatedProperty = {
            ...(schema.schemaProperties[0] as Object)["_doc"],
            updatedAt: undefined,
            createdAt: undefined,
          };
          expect(JSON.stringify(prevProperty)).to.equal(
            JSON.stringify(updatedProperty)
          );
        }
      });

      it("Should update property ref", async () => {
        let functionError: Object = {};
        const secondProperty = (await PropertyManager.create({
          ...propertyObjectIdExample,
          propertyRef: schema.schemaName,
        })) as IProperty;
        try {
          await SchemaManager.updateById(schema._id as string, {
            ...schemaExample,
            schemaName: ANOTHER_SCHEMA_NAME,
          });
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof DuplicateSchemaNameError).to.be.true;
          expect(
            (await PropertyManager.getById(secondProperty._id as string))
              ?.propertyRef
          ).to.be.equal(schema.schemaName);
        }
      });
    });

    context("Invalid schema id", () => {
      it("Should throw an InvalidIdError", async () => {
        let functionError: Object = {};
        try {
          (await SchemaManager.updateById(INVALID_ID, newSchema)) as ISchema;
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof InvalidIdError).to.be.true;
        }
      });
    });

    context("Schema not found", () => {
      it("Should throw an SchemaNotFoundError", async () => {
        let functionError: Object = {};
        try {
          (await SchemaManager.updateById(ID_NOT_EXIST, newSchema)) as ISchema;
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof SchemaNotFoundError).to.be.true;
        }
      });
    });

    context("Invalid property field value", () => {
      it("Should throw an InvalidValueInPropertyError", async () => {
        let functionError: Object = {};
        try {
          const invalidProperty: IProperty = {
              ...propertyNumberExample,
              propertyType: "f",
            },
            schemaWithInvalidProp: ISchema = {
              ...newSchema,
              schemaProperties: [invalidProperty],
            };
          (await SchemaManager.updateById(
            schema._id as string,
            schemaWithInvalidProp
          )) as ISchema;
        } catch (error) {
          functionError = error;
        } finally {
          expect(functionError instanceof InvalidValueInPropertyError).to.be
            .true;
        }
      });
    });
  });
});
