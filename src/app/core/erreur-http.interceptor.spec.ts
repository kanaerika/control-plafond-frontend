import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { erreurHttpInterceptor } from './erreur-http.interceptor';

describe('erreurHttpInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erreurHttpInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  function erreurRecue(corps: object, status = 409): HttpErrorResponse {
    let recue: HttpErrorResponse | undefined;
    http.get('/api/test').subscribe({ error: e => (recue = e) });
    backend.expectOne('/api/test').flush(corps, { status, statusText: 'Erreur' });
    return recue!;
  }

  it('recopie le detail d\'une réponse ProblemDetail dans message', () => {
    const err = erreurRecue({ title: 'Suppression impossible', status: 409, detail: 'Partenaire avec historique.' });
    expect(err.error.message).toBe('Partenaire avec historique.');
    expect(err.error.detail).toBe('Partenaire avec historique.');
    expect(err.status).toBe(409);
  });

  it('ne remplace pas un message déjà présent', () => {
    const err = erreurRecue({ message: 'Message Spring', detail: 'Autre texte' }, 500);
    expect(err.error.message).toBe('Message Spring');
  });

  it('laisse intactes les erreurs sans detail', () => {
    const err = erreurRecue({ error: 'Bad Request' }, 400);
    expect(err.error.message).toBeUndefined();
    expect(err.error.error).toBe('Bad Request');
  });
});
