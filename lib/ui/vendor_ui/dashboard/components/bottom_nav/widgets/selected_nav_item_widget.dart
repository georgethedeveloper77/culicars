import 'package:flutter/material.dart';


class SelectedNavItemWidget extends StatelessWidget {
  const SelectedNavItemWidget({required this.icon});
  final Widget icon;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        icon,
        Container(
          width: 17,
          height: 2,
          decoration: BoxDecoration(
            shape: BoxShape.rectangle,
            color: Theme.of(context).primaryColor,
          ),
        )
      ],
    );
  }
}
