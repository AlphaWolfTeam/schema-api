import { Request, Response } from 'express';
import SchemaManager from './schema.manager';
import ISchema from './schema.interface';

export default class SchemaController {
    static async create(req: Request, res: Response): Promise<void> {
        const schema: ISchema = {
            schemaName: req.body.schemaName,
            schemaProperties: [],
            permissions: req.body.permissions,
            createdAt: req.body.createdAt,
            updatedAt: req.body.updatedAt,
        }
        res.json(await SchemaManager.createSchema(schema, req.body.schemaProperties));
        res.end();
    }

    static async update(req: Request, res: Response): Promise<void> {
        try {
            const updated = await SchemaManager.updateById(req.params.id, req.body);
            if (updated) {
            }
            res.json(updated);
        } catch (e) {
            throw e;
        }
    }

    static async deleteSchema(req: Request, res: Response): Promise<void> {
        try {
            const deleted = await SchemaManager.deleteSchema(req.params.id);
            if (deleted) {
            }
            res.json(deleted);
        } catch (e) {
            throw e;
        }
    }

    static async deleteProperty(req: Request, res: Response): Promise<void> {
        try {
            const schema = await SchemaManager.deleteProperty(req.params.id, req.params.propertyId);
            if (schema) {
            }
            res.json(schema);
        } catch (e) {
            throw e;
        }
    }

    static async getById(req: Request, res: Response){
        const schemaId: string = req.params.id;
        res.json(await SchemaManager.getById(schemaId));
        res.end();
    }

    static async getAll(req: Request, res: Response) {
        console.log(req)
        res.json(await SchemaManager.getAll());
        res.end();
    }

}