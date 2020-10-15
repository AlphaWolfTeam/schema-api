"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("./../utils/errors/user");
const schema_repository_1 = __importDefault(require("./schema.repository"));
const property_manager_1 = __importDefault(require("../property/property.manager"));
const user_2 = require("../utils/errors/user");
const MONGO_UNIQUE_NAME_CODE = 11000;
class SchemaManager {
    static create(schema, schemaProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            schema.schemaProperties = [];
            this.checkIfAllPropertiesUnique(schemaProperties);
            yield this.createSchemaProperties(schemaProperties, schema);
            return schema_repository_1.default.create(Object.assign(Object.assign({}, schema), { createdAt: new Date(), updatedAt: new Date() }))
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                yield this.revertCreation(schema);
                this.handleCreationError(error);
            }));
        });
    }
    static revertCreation(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            schema.schemaProperties.forEach((property) => {
                property_manager_1.default.deleteById(property._id);
            });
        });
    }
    static createSchemaProperties(schemaProperties, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let property of schemaProperties) {
                schema.schemaProperties.push((yield property_manager_1.default.create(property).catch((error) => {
                    schema.schemaProperties.forEach((property) => {
                        property_manager_1.default.deleteById(property._id);
                    });
                    throw error;
                })));
            }
        });
    }
    static deleteSchema(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = yield schema_repository_1.default.deleteById(id).catch(() => {
                throw new user_2.InvalidIdError();
            });
            if (schema) {
                schema.schemaProperties.forEach((property) => {
                    property_manager_1.default.deleteById(String(property));
                });
            }
            else {
                throw new user_2.SchemaNotFoundError();
            }
        });
    }
    static deleteProperty(schemaId, propertyId) {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = (yield this.getById(schemaId));
            const propertyIndex = this.getPropertyIndexInList(schema.schemaProperties, propertyId);
            if (propertyIndex > -1) {
                schema.schemaProperties.splice(propertyIndex, 1);
                yield property_manager_1.default.deleteById(propertyId);
            }
            else {
                throw new user_1.PropertyNotInSchemaError();
            }
            schema_repository_1.default.updateById(schemaId, schema);
        });
    }
    static getById(schemaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = yield schema_repository_1.default.getById(schemaId).catch(() => {
                throw new user_2.InvalidIdError();
            });
            if (schema === null) {
                throw new user_2.SchemaNotFoundError();
            }
            return schema;
        });
    }
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield schema_repository_1.default.getAll();
        });
    }
    static updateById(id, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            const prevSchema = (yield this.getById(id));
            const newProperties = [...schema.schemaProperties];
            const updatedProperties = [];
            const createdProperties = [];
            const deletedProperties = [];
            schema.schemaProperties = [];
            this.checkIfAllPropertiesUnique(newProperties);
            yield this.updatePrevProperties(prevSchema, newProperties, schema, updatedProperties, deletedProperties);
            yield this.createNewProperties(prevSchema, newProperties, schema, createdProperties);
            return schema_repository_1.default.updateById(id, Object.assign(Object.assign({}, schema), { updatedAt: new Date() }))
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                yield this.revertUpdate(createdProperties, updatedProperties, deletedProperties);
                this.handleCreationError(error);
            }));
        });
    }
    static updatePrevProperties(prevSchema, newProperties, schema, updatedProperties, deletedProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(prevSchema.schemaProperties.map((prevProperty) => __awaiter(this, void 0, void 0, function* () {
                let newPropertyIndex = this.getPropertyIndexInList(newProperties, String(prevProperty._id));
                if (newPropertyIndex === -1) {
                    deletedProperties.push((yield property_manager_1.default.deleteById(prevProperty._id))["_doc"]);
                }
                else {
                    updatedProperties.push((yield property_manager_1.default.getById(prevProperty._id))["_doc"]);
                    schema.schemaProperties.push(yield property_manager_1.default.updateById(prevProperty._id, newProperties[newPropertyIndex]));
                }
            })));
        });
    }
    static createNewProperties(prevSchema, newProperties, schema, createdProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(newProperties.map((newProperty) => __awaiter(this, void 0, void 0, function* () {
                let prevPropertyIndex = this.getPropertyIndexInList(prevSchema.schemaProperties, newProperty._id);
                if (prevPropertyIndex === -1) {
                    let createdProperty = (yield property_manager_1.default.create(newProperty));
                    schema.schemaProperties.push(createdProperty);
                    createdProperties.push(createdProperty);
                }
            })));
        });
    }
    static revertUpdate(createdProperties, updatedProperties, deletedProperties) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(createdProperties.map((createdProperty) => __awaiter(this, void 0, void 0, function* () {
                yield property_manager_1.default.deleteById(createdProperty._id);
            })));
            yield Promise.all(updatedProperties.map((updatedProperty) => __awaiter(this, void 0, void 0, function* () {
                yield property_manager_1.default.updateById(updatedProperty._id, updatedProperty);
            })));
            yield Promise.all(deletedProperties.map((deletedProperty) => __awaiter(this, void 0, void 0, function* () {
                yield property_manager_1.default.create(deletedProperty);
            })));
        });
    }
    static checkIfAllPropertiesUnique(propertyList) {
        const nameArray = propertyList.map((property) => property.propertyName);
        const isAllPropertiesUnique = nameArray.every((name) => nameArray.indexOf(name) === nameArray.lastIndexOf(name));
        if (!isAllPropertiesUnique) {
            throw new user_1.DuplicatePropertyNameError();
        }
    }
    static handleCreationError(error) {
        if (error["code"] === MONGO_UNIQUE_NAME_CODE) {
            throw new user_1.DuplicateSchemaNameError();
        }
        else {
            throw new user_2.InvalidValueInSchemaError();
        }
    }
    static getPropertyIndexInList(propertiesList, propertyIdToFind) {
        return propertiesList.map((property) => property._id).indexOf(propertyIdToFind);
    }
}
exports.default = SchemaManager;
//# sourceMappingURL=schema.manager.js.map