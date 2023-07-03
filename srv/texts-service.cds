using {cc.slova.model as db} from '../db/schema';

@path: '/texts'
service TextsService {

    @readonly
    entity Texts     as projection on db.Import where createdBy = 'admin' order by
        name asc;

    @readonly
    entity Sentences as projection on db.ImportSentences order by
        index asc;

    @readonly
    entity Slova     as projection on db.ImportWords;

    @readonly
    entity Forms     as projection on db.ImportForms;
}
