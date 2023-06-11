using {cc.slova.model as db} from '../db/schema';

@path    : '/admin'
@requires: 'admin-user'
service AdminService {
    entity Slova        as projection on db.Slova;
    entity Forms        as projection on db.Forms;
    entity Translations as projection on db.Translations;
    entity Etymology    as projection on db.Etymology;
    entity Languages    as projection on db.Languages;
}
