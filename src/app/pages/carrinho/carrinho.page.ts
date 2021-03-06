import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Produto } from 'src/app/interfaces/produto';
import { Usuario } from 'src/app/interfaces/usuario';
import { AuthService } from 'src/app/services/auth.service';
import firebase from "firebase/app"

@Component({
  selector: 'app-carrinho',
  templateUrl: './carrinho.page.html',
  styleUrls: ['./carrinho.page.scss'],
})
export class CarrinhoPage {

  public subtotal: number = 0;
  public frete: number = 5;
  public total: number = 0;
  public id: string;

  public quantidadeCarrinho: number;

  public carrinho: Produto[];

  public usuario: Usuario = null;
  public usuarioId: string = null;
  public usuarioSubscription: Subscription;

  constructor(private authService: AuthService,
    private navCtrl: NavController,
    private toastCtrl: ToastController) {
    this.carregarDados();
  }

  public async carregarDados() {
    this.usuarioId = (await this.authService.getAuth().currentUser).uid
    this.usuarioSubscription = this.authService.getUsuario(this.usuarioId).subscribe(data => {
      this.usuario = data;
      this.carrinho = this.usuario.carrinho;
      this.quantidadeCarrinho = this.carrinho.length;
      this.resetarValores()
      this.atualizarValor()
    });
  }

  ngOnDestroy() {
    this.usuarioSubscription.unsubscribe();
  }

  public filtrar(produto: Produto) {
    const c = produto.personalizacao.filter(c => c.marcado === true)
    return c;
  }

  public excluirDoCarrinho(produto: Produto) {
    const index = this.carrinho.findIndex(p => p === produto)
    this.carrinho.splice(index, 1);
    this.authService.atualizarCarrinho(this.usuarioId, this.carrinho);
    this.atualizarValor()
  }

  public atualizarValor() {
    for (let produto of this.carrinho) {
      this.subtotal += produto.valorTotal
    }
    this.total = this.frete + this.subtotal;
  }

  public verificaPedido(){
    if(this.usuario.dadoEndereco.endereco === undefined || this.usuario.dadoEndereco.numero === undefined){
      this.toast();
      return
    }else if(this.usuario.dadoEndereco.endereco === '' || this.usuario.dadoEndereco.numero === null){
      this.toast();
      return
    }else{
      this.fazerPedido();
    }
  }

  private fazerPedido() {
    this.id = 'pedido' + Math.max(this.usuario.pedidos.length + 1)
    this.usuario.pedidos.unshift({ id: this.id, produtos: this.carrinho, subtotal: this.subtotal, frete: this.frete, total: this.total, data: firebase.firestore.Timestamp.now(), endereco: this.usuario.dadoEndereco.endereco, numero: this.usuario.dadoEndereco.numero })
    this.usuario.carrinho = []
    console.log(this.usuario.pedidos)
    this.authService.atualizarPedidos(this.usuarioId, this.usuario)
    this.authService.atualizarCarrinho(this.usuarioId, this.usuario.carrinho)
    this.resetarValores();
    this.navCtrl.navigateBack('/home');
    console.log(this.usuario.pedidos)
  }

  public resetarValores() {
    this.subtotal = 0;
    this.total = 0;
  }

  async toast() {
    const toast = await this.toastCtrl.create({ message: 'Preencha seu endereco corretamente!', duration: 2000, color: 'primary' });
    toast.present();
  }

}
